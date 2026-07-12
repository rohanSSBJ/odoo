import { UnprocessableEntityException, NotFoundException } from '@nestjs/common';
import {
  Driver,
  DriverStatus,
  Trip,
  TripStatus,
  Vehicle,
  VehicleStatus,
} from '@prisma/client';
import { TripsService } from './trips.service';

function makeTrip(overrides: Partial<Trip> = {}): Trip {
  return {
    id: 'trip-1',
    source: 'A',
    destination: 'B',
    vehicleId: 'veh-1',
    driverId: 'drv-1',
    createdById: null,
    cargoWeight: 1000,
    plannedDistance: 100,
    finalOdometer: null,
    fuelConsumed: null,
    revenue: null,
    status: TripStatus.DRAFT,
    createdAt: new Date(),
    ...overrides,
  } as Trip;
}

function makeVehicle(overrides: Partial<Vehicle> = {}): Vehicle {
  return {
    id: 'veh-1',
    regNo: 'TRK-001',
    name: 'Truck',
    type: 'Heavy Truck',
    maxLoadKg: 20000,
    odometer: 1000,
    acquisitionCost: 100000,
    status: VehicleStatus.AVAILABLE,
    createdAt: new Date(),
    ...overrides,
  } as Vehicle;
}

function makeDriver(overrides: Partial<Driver> = {}): Driver {
  return {
    id: 'drv-1',
    name: 'Driver',
    licenseNo: 'DL-1',
    licenseCategory: 'CE',
    licenseExpiry: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365),
    contact: null,
    safetyScore: 100,
    status: DriverStatus.AVAILABLE,
    createdAt: new Date(),
    ...overrides,
  } as Driver;
}

describe('TripsService.assertDispatchable (business guards)', () => {
  it('passes for a valid DRAFT trip / AVAILABLE vehicle / valid driver', () => {
    expect(() =>
      TripsService.assertDispatchable(makeTrip(), makeVehicle(), makeDriver()),
    ).not.toThrow();
  });

  it('rejects non-DRAFT trips', () => {
    expect(() =>
      TripsService.assertDispatchable(
        makeTrip({ status: TripStatus.DISPATCHED }),
        makeVehicle(),
        makeDriver(),
      ),
    ).toThrow(UnprocessableEntityException);
  });

  it('rejects a vehicle that is not AVAILABLE (ON_TRIP)', () => {
    expect(() =>
      TripsService.assertDispatchable(
        makeTrip(),
        makeVehicle({ status: VehicleStatus.ON_TRIP }),
        makeDriver(),
      ),
    ).toThrow(/not available/i);
  });

  it('rejects a RETIRED vehicle', () => {
    expect(() =>
      TripsService.assertDispatchable(
        makeTrip(),
        makeVehicle({ status: VehicleStatus.RETIRED }),
        makeDriver(),
      ),
    ).toThrow(UnprocessableEntityException);
  });

  it('rejects an IN_SHOP vehicle', () => {
    expect(() =>
      TripsService.assertDispatchable(
        makeTrip(),
        makeVehicle({ status: VehicleStatus.IN_SHOP }),
        makeDriver(),
      ),
    ).toThrow(UnprocessableEntityException);
  });

  it('rejects a SUSPENDED driver', () => {
    expect(() =>
      TripsService.assertDispatchable(
        makeTrip(),
        makeVehicle(),
        makeDriver({ status: DriverStatus.SUSPENDED }),
      ),
    ).toThrow(/suspended/i);
  });

  it('rejects a driver already ON_TRIP', () => {
    expect(() =>
      TripsService.assertDispatchable(
        makeTrip(),
        makeVehicle(),
        makeDriver({ status: DriverStatus.ON_TRIP }),
      ),
    ).toThrow(UnprocessableEntityException);
  });

  it('rejects an expired license', () => {
    expect(() =>
      TripsService.assertDispatchable(
        makeTrip(),
        makeVehicle(),
        makeDriver({ licenseExpiry: new Date(Date.now() - 1000) }),
      ),
    ).toThrow(/license has expired/i);
  });

  it('rejects cargo exceeding vehicle max load', () => {
    expect(() =>
      TripsService.assertDispatchable(
        makeTrip({ cargoWeight: 30000 }),
        makeVehicle({ maxLoadKg: 20000 }),
        makeDriver(),
      ),
    ).toThrow(/exceeds vehicle max load/i);
  });
});

describe('TripsService transactional transitions', () => {
  let service: TripsService;
  let tx: any;
  let prisma: any;

  beforeEach(() => {
    tx = {
      trip: { findUnique: jest.fn(), update: jest.fn() },
      vehicle: { findUnique: jest.fn(), update: jest.fn() },
      driver: { findUnique: jest.fn(), update: jest.fn() },
    };
    prisma = {
      $transaction: jest.fn((cb: any) => cb(tx)),
    };
    service = new TripsService(prisma);
  });

  it('dispatch sets trip, vehicle and driver to ON_TRIP atomically', async () => {
    tx.trip.findUnique.mockResolvedValue(makeTrip());
    tx.vehicle.findUnique.mockResolvedValue(makeVehicle());
    tx.driver.findUnique.mockResolvedValue(makeDriver());
    tx.trip.update.mockResolvedValue(makeTrip({ status: TripStatus.DISPATCHED }));

    await service.dispatch('trip-1');

    expect(tx.vehicle.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: VehicleStatus.ON_TRIP } }),
    );
    expect(tx.driver.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: DriverStatus.ON_TRIP } }),
    );
    expect(tx.trip.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: TripStatus.DISPATCHED }),
      }),
    );
  });

  it('dispatch throws 422 and does NOT mutate when cargo exceeds capacity', async () => {
    tx.trip.findUnique.mockResolvedValue(makeTrip({ cargoWeight: 999999 }));
    tx.vehicle.findUnique.mockResolvedValue(makeVehicle({ maxLoadKg: 1000 }));
    tx.driver.findUnique.mockResolvedValue(makeDriver());

    await expect(service.dispatch('trip-1')).rejects.toBeInstanceOf(
      UnprocessableEntityException,
    );
    expect(tx.vehicle.update).not.toHaveBeenCalled();
    expect(tx.driver.update).not.toHaveBeenCalled();
    expect(tx.trip.update).not.toHaveBeenCalled();
  });

  it('dispatch throws 404 for a missing trip', async () => {
    tx.trip.findUnique.mockResolvedValue(null);
    await expect(service.dispatch('nope')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('complete restores vehicle + driver to AVAILABLE and records odometer/fuel', async () => {
    tx.trip.findUnique.mockResolvedValue(
      makeTrip({ status: TripStatus.DISPATCHED }),
    );
    tx.trip.update.mockResolvedValue(makeTrip({ status: TripStatus.COMPLETED }));

    await service.complete('trip-1', {
      finalOdometer: 5000,
      fuelConsumed: 120,
      revenue: 999,
    });

    expect(tx.vehicle.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { status: VehicleStatus.AVAILABLE, odometer: 5000 },
      }),
    );
    expect(tx.driver.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: DriverStatus.AVAILABLE } }),
    );
    expect(tx.trip.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: TripStatus.COMPLETED,
          finalOdometer: 5000,
          fuelConsumed: 120,
          revenue: 999,
        }),
      }),
    );
  });

  it('complete rejects a trip that is not DISPATCHED', async () => {
    tx.trip.findUnique.mockResolvedValue(makeTrip({ status: TripStatus.DRAFT }));
    await expect(
      service.complete('trip-1', { finalOdometer: 1, fuelConsumed: 1 }),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
    expect(tx.vehicle.update).not.toHaveBeenCalled();
  });

  it('cancel on a DISPATCHED trip restores vehicle + driver', async () => {
    tx.trip.findUnique.mockResolvedValue(
      makeTrip({ status: TripStatus.DISPATCHED }),
    );
    tx.trip.update.mockResolvedValue(makeTrip({ status: TripStatus.CANCELLED }));

    await service.cancel('trip-1');

    expect(tx.vehicle.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: VehicleStatus.AVAILABLE } }),
    );
    expect(tx.driver.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: DriverStatus.AVAILABLE } }),
    );
  });

  it('cancel on a DRAFT trip does not touch vehicle/driver', async () => {
    tx.trip.findUnique.mockResolvedValue(makeTrip({ status: TripStatus.DRAFT }));
    tx.trip.update.mockResolvedValue(makeTrip({ status: TripStatus.CANCELLED }));

    await service.cancel('trip-1');

    expect(tx.vehicle.update).not.toHaveBeenCalled();
    expect(tx.driver.update).not.toHaveBeenCalled();
  });

  it('cancel rejects an already COMPLETED trip', async () => {
    tx.trip.findUnique.mockResolvedValue(
      makeTrip({ status: TripStatus.COMPLETED }),
    );
    await expect(service.cancel('trip-1')).rejects.toBeInstanceOf(
      UnprocessableEntityException,
    );
  });
});
