import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  Driver,
  DriverStatus,
  Prisma,
  Trip,
  TripStatus,
  Vehicle,
  VehicleStatus,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  PaginatedResult,
  buildOrderBy,
} from '../../common/dto/pagination.dto';
import { CreateTripDto } from './dto/create-trip.dto';
import { CompleteTripDto } from './dto/complete-trip.dto';
import { QueryTripDto } from './dto/query-trip.dto';

const SORTABLE = ['source', 'destination', 'cargoWeight', 'status', 'createdAt'];
const TRIP_INCLUDE = {
  vehicle: { select: { id: true, regNo: true, name: true, status: true } },
  driver: { select: { id: true, name: true, licenseNo: true, status: true } },
} satisfies Prisma.TripInclude;

@Injectable()
export class TripsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Pure business-rule guard for dispatching a trip. Throws 422 on any violation.
   * Kept static + side-effect-free so it is unit-testable without a database.
   */
  static assertDispatchable(trip: Trip, vehicle: Vehicle, driver: Driver): void {
    if (trip.status !== TripStatus.DRAFT) {
      throw new UnprocessableEntityException(
        `Only DRAFT trips can be dispatched (current: ${trip.status})`,
      );
    }
    // Vehicle must be available (not ON_TRIP, IN_SHOP, or RETIRED)
    if (vehicle.status !== VehicleStatus.AVAILABLE) {
      throw new UnprocessableEntityException(
        `Vehicle is not available for dispatch (status: ${vehicle.status})`,
      );
    }
    // Driver must be available (not ON_TRIP, OFF_DUTY, or SUSPENDED)
    if (driver.status === DriverStatus.SUSPENDED) {
      throw new UnprocessableEntityException('Driver is suspended');
    }
    if (driver.status !== DriverStatus.AVAILABLE) {
      throw new UnprocessableEntityException(
        `Driver is not available for dispatch (status: ${driver.status})`,
      );
    }
    // License must not be expired
    if (new Date(driver.licenseExpiry).getTime() <= Date.now()) {
      throw new UnprocessableEntityException('Driver license has expired');
    }
    // Cargo must not exceed vehicle capacity
    if (trip.cargoWeight > vehicle.maxLoadKg) {
      throw new UnprocessableEntityException(
        `Cargo weight (${trip.cargoWeight}kg) exceeds vehicle max load (${vehicle.maxLoadKg}kg)`,
      );
    }
  }

  async findAll(query: QueryTripDto): Promise<PaginatedResult<any>> {
    const { page, limit, q, sort, status, vehicleId, driverId } = query;

    const where: Prisma.TripWhereInput = {};
    if (status) where.status = status;
    if (vehicleId) where.vehicleId = vehicleId;
    if (driverId) where.driverId = driverId;
    if (q) {
      where.OR = [
        { source: { contains: q, mode: 'insensitive' } },
        { destination: { contains: q, mode: 'insensitive' } },
      ];
    }

    const orderBy = buildOrderBy(sort, SORTABLE, { createdAt: 'desc' });

    const [data, total] = await this.prisma.$transaction([
      this.prisma.trip.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: TRIP_INCLUDE,
      }),
      this.prisma.trip.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) || 1 },
    };
  }

  async findOne(id: string) {
    const trip = await this.prisma.trip.findUnique({
      where: { id },
      include: TRIP_INCLUDE,
    });
    if (!trip) throw new NotFoundException('Trip not found');
    return trip;
  }

  async create(dto: CreateTripDto, userId?: string) {
    // Validate referenced entities exist (clearer 404 than a raw FK error).
    const [vehicle, driver] = await Promise.all([
      this.prisma.vehicle.findUnique({ where: { id: dto.vehicleId } }),
      this.prisma.driver.findUnique({ where: { id: dto.driverId } }),
    ]);
    if (!vehicle) throw new NotFoundException('Vehicle not found');
    if (!driver) throw new NotFoundException('Driver not found');

    return this.prisma.trip.create({
      data: {
        source: dto.source,
        destination: dto.destination,
        vehicleId: dto.vehicleId,
        driverId: dto.driverId,
        cargoWeight: dto.cargoWeight,
        plannedDistance: dto.plannedDistance,
        revenue: dto.revenue,
        createdById: userId,
        status: TripStatus.DRAFT,
      },
      include: TRIP_INCLUDE,
    });
  }

  /** Dispatch: atomic transition of trip + vehicle + driver to ON_TRIP. */
  async dispatch(id: string) {
    return this.prisma.$transaction(async (tx) => {
      const trip = await tx.trip.findUnique({ where: { id } });
      if (!trip) throw new NotFoundException('Trip not found');
      const vehicle = await tx.vehicle.findUnique({
        where: { id: trip.vehicleId },
      });
      const driver = await tx.driver.findUnique({
        where: { id: trip.driverId },
      });
      if (!vehicle) throw new NotFoundException('Vehicle not found');
      if (!driver) throw new NotFoundException('Driver not found');

      TripsService.assertDispatchable(trip, vehicle, driver);

      await tx.vehicle.update({
        where: { id: vehicle.id },
        data: { status: VehicleStatus.ON_TRIP },
      });
      await tx.driver.update({
        where: { id: driver.id },
        data: { status: DriverStatus.ON_TRIP },
      });
      return tx.trip.update({
        where: { id },
        data: { status: TripStatus.DISPATCHED },
        include: TRIP_INCLUDE,
      });
    });
  }

  /** Complete: records final odometer + fuel, restores vehicle + driver to AVAILABLE. */
  async complete(id: string, dto: CompleteTripDto) {
    return this.prisma.$transaction(async (tx) => {
      const trip = await tx.trip.findUnique({ where: { id } });
      if (!trip) throw new NotFoundException('Trip not found');
      if (trip.status !== TripStatus.DISPATCHED) {
        throw new UnprocessableEntityException(
          `Only DISPATCHED trips can be completed (current: ${trip.status})`,
        );
      }

      await tx.vehicle.update({
        where: { id: trip.vehicleId },
        data: { status: VehicleStatus.AVAILABLE, odometer: dto.finalOdometer },
      });
      await tx.driver.update({
        where: { id: trip.driverId },
        data: { status: DriverStatus.AVAILABLE },
      });
      return tx.trip.update({
        where: { id },
        data: {
          status: TripStatus.COMPLETED,
          finalOdometer: dto.finalOdometer,
          fuelConsumed: dto.fuelConsumed,
          revenue: dto.revenue ?? trip.revenue,
        },
        include: TRIP_INCLUDE,
      });
    });
  }

  /** Cancel: DRAFT -> CANCELLED (no side effects); DISPATCHED -> restore both to AVAILABLE. */
  async cancel(id: string) {
    return this.prisma.$transaction(async (tx) => {
      const trip = await tx.trip.findUnique({ where: { id } });
      if (!trip) throw new NotFoundException('Trip not found');
      if (
        trip.status === TripStatus.COMPLETED ||
        trip.status === TripStatus.CANCELLED
      ) {
        throw new UnprocessableEntityException(
          `Cannot cancel a ${trip.status} trip`,
        );
      }

      if (trip.status === TripStatus.DISPATCHED) {
        await tx.vehicle.update({
          where: { id: trip.vehicleId },
          data: { status: VehicleStatus.AVAILABLE },
        });
        await tx.driver.update({
          where: { id: trip.driverId },
          data: { status: DriverStatus.AVAILABLE },
        });
      }
      return tx.trip.update({
        where: { id },
        data: { status: TripStatus.CANCELLED },
        include: TRIP_INCLUDE,
      });
    });
  }
}
