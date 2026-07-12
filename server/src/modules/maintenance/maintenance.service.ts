import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Prisma, VehicleStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  PaginatedResult,
  buildOrderBy,
} from '../../common/dto/pagination.dto';
import { CreateMaintenanceDto } from './dto/create-maintenance.dto';
import { CloseMaintenanceDto } from './dto/close-maintenance.dto';
import { QueryMaintenanceDto } from './dto/query-maintenance.dto';

const SORTABLE = ['type', 'cost', 'isOpen', 'openedAt', 'closedAt'];

@Injectable()
export class MaintenanceService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: QueryMaintenanceDto): Promise<PaginatedResult<any>> {
    const { page, limit, q, sort, vehicleId, isOpen } = query;

    const where: Prisma.MaintenanceLogWhereInput = {};
    if (vehicleId) where.vehicleId = vehicleId;
    if (isOpen !== undefined) where.isOpen = isOpen === 'true';
    if (q) where.type = { contains: q, mode: 'insensitive' };

    const orderBy = buildOrderBy(sort, SORTABLE, { openedAt: 'desc' });

    const [data, total] = await this.prisma.$transaction([
      this.prisma.maintenanceLog.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          vehicle: { select: { id: true, regNo: true, name: true, status: true } },
        },
      }),
      this.prisma.maintenanceLog.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) || 1 },
    };
  }

  /** Open maintenance: create log + flip vehicle to IN_SHOP (atomic). */
  async open(dto: CreateMaintenanceDto) {
    return this.prisma.$transaction(async (tx) => {
      const vehicle = await tx.vehicle.findUnique({
        where: { id: dto.vehicleId },
      });
      if (!vehicle) throw new NotFoundException('Vehicle not found');
      if (vehicle.status === VehicleStatus.ON_TRIP) {
        throw new UnprocessableEntityException(
          'Cannot open maintenance on a vehicle that is ON_TRIP',
        );
      }
      if (vehicle.status === VehicleStatus.RETIRED) {
        throw new UnprocessableEntityException(
          'Cannot open maintenance on a RETIRED vehicle',
        );
      }

      const log = await tx.maintenanceLog.create({
        data: {
          vehicleId: dto.vehicleId,
          type: dto.type,
          cost: dto.cost ?? 0,
          notes: dto.notes,
          isOpen: true,
        },
      });
      await tx.vehicle.update({
        where: { id: dto.vehicleId },
        data: { status: VehicleStatus.IN_SHOP },
      });
      return log;
    });
  }

  /** Close maintenance: mark closed + restore vehicle to AVAILABLE unless RETIRED (atomic). */
  async close(id: string, dto: CloseMaintenanceDto) {
    return this.prisma.$transaction(async (tx) => {
      const log = await tx.maintenanceLog.findUnique({ where: { id } });
      if (!log) throw new NotFoundException('Maintenance record not found');
      if (!log.isOpen) {
        throw new UnprocessableEntityException(
          'Maintenance record is already closed',
        );
      }

      const updated = await tx.maintenanceLog.update({
        where: { id },
        data: {
          isOpen: false,
          closedAt: new Date(),
          cost: dto.cost ?? log.cost,
          notes: dto.notes ?? log.notes,
        },
      });

      const vehicle = await tx.vehicle.findUnique({
        where: { id: log.vehicleId },
      });
      // Do not resurrect a retired vehicle.
      if (vehicle && vehicle.status !== VehicleStatus.RETIRED) {
        await tx.vehicle.update({
          where: { id: log.vehicleId },
          data: { status: VehicleStatus.AVAILABLE },
        });
      }
      return updated;
    });
  }
}
