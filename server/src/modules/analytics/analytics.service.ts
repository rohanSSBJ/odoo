import { Injectable } from '@nestjs/common';
import { TripStatus, VehicleStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  /** Dashboard KPIs per ARCHITECTURE.md §7. */
  async kpis() {
    const soon = new Date();
    soon.setDate(soon.getDate() + 30);

    const [
      vehiclesByStatus,
      driversByStatus,
      tripsByStatus,
      fuelAgg,
      maintAgg,
      completedTrips,
      acqAgg,
      expiredLicenses,
      expiringLicenses,
      openMaintenance,
    ] = await this.prisma.$transaction([
      this.prisma.vehicle.groupBy({
        by: ['status'],
        _count: { _all: true },
        orderBy: { status: 'asc' },
      }),
      this.prisma.driver.groupBy({
        by: ['status'],
        _count: { _all: true },
        orderBy: { status: 'asc' },
      }),
      this.prisma.trip.groupBy({
        by: ['status'],
        _count: { _all: true },
        orderBy: { status: 'asc' },
      }),
      this.prisma.fuelLog.aggregate({
        _sum: { cost: true, liters: true },
      }),
      this.prisma.maintenanceLog.aggregate({ _sum: { cost: true } }),
      this.prisma.trip.aggregate({
        where: { status: TripStatus.COMPLETED },
        _sum: { revenue: true, plannedDistance: true, fuelConsumed: true },
      }),
      this.prisma.vehicle.aggregate({ _sum: { acquisitionCost: true } }),
      this.prisma.driver.count({ where: { licenseExpiry: { lt: new Date() } } }),
      this.prisma.driver.count({
        where: { licenseExpiry: { gte: new Date(), lte: soon } },
      }),
      this.prisma.maintenanceLog.count({ where: { isOpen: true } }),
    ]);

    const countBy = (
      rows: Array<{ status: string; _count: { _all: number } }>,
    ): Record<string, number> =>
      rows.reduce(
        (acc, r) => ({ ...acc, [r.status]: r._count._all }),
        {} as Record<string, number>,
      );

    const vStatus = countBy(vehiclesByStatus as any);
    const totalVehicles = Object.values(vStatus).reduce((a, b) => a + b, 0);
    const onTrip = vStatus[VehicleStatus.ON_TRIP] ?? 0;
    const operational = totalVehicles - (vStatus[VehicleStatus.RETIRED] ?? 0);

    const fuelCost = fuelAgg._sum.cost ?? 0;
    const maintenanceCost = maintAgg._sum.cost ?? 0;
    const totalRevenue = completedTrips._sum.revenue ?? 0;
    const totalDistance = completedTrips._sum.plannedDistance ?? 0;
    const totalFuelConsumed = completedTrips._sum.fuelConsumed ?? 0;
    const acquisitionCost = acqAgg._sum.acquisitionCost ?? 0;

    const operationalCost = fuelCost + maintenanceCost;

    return {
      fleetUtilizationPct:
        operational > 0 ? Number(((onTrip / operational) * 100).toFixed(1)) : 0,
      fuelEfficiency:
        totalFuelConsumed > 0
          ? Number((totalDistance / totalFuelConsumed).toFixed(2))
          : 0,
      operationalCost,
      fuelCost,
      maintenanceCost,
      totalRevenue,
      fleetRoi:
        acquisitionCost > 0
          ? Number(
              (
                (totalRevenue - operationalCost) /
                acquisitionCost
              ).toFixed(3),
            )
          : 0,
      counts: {
        vehicles: { total: totalVehicles, byStatus: vStatus },
        drivers: { byStatus: countBy(driversByStatus as any) },
        trips: { byStatus: countBy(tripsByStatus as any) },
      },
      alerts: {
        expiredLicenses,
        expiringLicenses,
        openMaintenance,
      },
    };
  }

  /** Per-vehicle report rows (used by CSV export). */
  async vehicleReport() {
    const vehicles = await this.prisma.vehicle.findMany({
      orderBy: { regNo: 'asc' },
    });

    const rows = await Promise.all(
      vehicles.map(async (v) => {
        const [fuel, maint, trips] = await this.prisma.$transaction([
          this.prisma.fuelLog.aggregate({
            where: { vehicleId: v.id },
            _sum: { cost: true },
          }),
          this.prisma.maintenanceLog.aggregate({
            where: { vehicleId: v.id },
            _sum: { cost: true },
          }),
          this.prisma.trip.aggregate({
            where: { vehicleId: v.id, status: TripStatus.COMPLETED },
            _sum: { revenue: true },
          }),
        ]);
        const fuelCost = fuel._sum.cost ?? 0;
        const maintenanceCost = maint._sum.cost ?? 0;
        const revenue = trips._sum.revenue ?? 0;
        const roi =
          v.acquisitionCost > 0
            ? Number(
                (
                  (revenue - (maintenanceCost + fuelCost)) /
                  v.acquisitionCost
                ).toFixed(3),
              )
            : 0;
        return {
          regNo: v.regNo,
          name: v.name,
          type: v.type,
          status: v.status,
          odometer: v.odometer,
          acquisitionCost: v.acquisitionCost,
          fuelCost,
          maintenanceCost,
          revenue,
          roi,
        };
      }),
    );
    return rows;
  }

  async reportCsv(): Promise<string> {
    const rows = await this.vehicleReport();
    const headers = [
      'regNo',
      'name',
      'type',
      'status',
      'odometer',
      'acquisitionCost',
      'fuelCost',
      'maintenanceCost',
      'revenue',
      'roi',
    ];
    const escape = (val: unknown): string => {
      const s = String(val ?? '');
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const lines = [headers.join(',')];
    for (const r of rows) {
      lines.push(headers.map((h) => escape((r as any)[h])).join(','));
    }
    return lines.join('\n');
  }
}
