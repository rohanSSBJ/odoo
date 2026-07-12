import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  PaginatedResult,
  buildOrderBy,
} from '../../common/dto/pagination.dto';
import { CreateFuelLogDto } from './dto/create-fuel-log.dto';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { QueryFuelExpenseDto } from './dto/query-fuel-expense.dto';

@Injectable()
export class FuelExpensesService {
  constructor(private prisma: PrismaService) {}

  private async assertVehicle(vehicleId: string) {
    const v = await this.prisma.vehicle.findUnique({ where: { id: vehicleId } });
    if (!v) throw new NotFoundException('Vehicle not found');
  }

  // ---- Fuel logs ----
  async createFuelLog(dto: CreateFuelLogDto) {
    await this.assertVehicle(dto.vehicleId);
    return this.prisma.fuelLog.create({
      data: {
        vehicleId: dto.vehicleId,
        tripId: dto.tripId,
        liters: dto.liters,
        cost: dto.cost,
        ...(dto.date ? { date: new Date(dto.date) } : {}),
      },
    });
  }

  async findFuelLogs(query: QueryFuelExpenseDto): Promise<PaginatedResult<any>> {
    const { page, limit, sort, vehicleId } = query;
    const where: Prisma.FuelLogWhereInput = {};
    if (vehicleId) where.vehicleId = vehicleId;
    const orderBy = buildOrderBy(sort, ['liters', 'cost', 'date'], {
      date: 'desc',
    });
    const [data, total] = await this.prisma.$transaction([
      this.prisma.fuelLog.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          vehicle: { select: { id: true, regNo: true, name: true } },
        },
      }),
      this.prisma.fuelLog.count({ where }),
    ]);
    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) || 1 },
    };
  }

  // ---- Expenses ----
  async createExpense(dto: CreateExpenseDto) {
    await this.assertVehicle(dto.vehicleId);
    return this.prisma.expense.create({
      data: {
        vehicleId: dto.vehicleId,
        category: dto.category,
        amount: dto.amount,
        ...(dto.date ? { date: new Date(dto.date) } : {}),
      },
    });
  }

  async findExpenses(query: QueryFuelExpenseDto): Promise<PaginatedResult<any>> {
    const { page, limit, q, sort, vehicleId } = query;
    const where: Prisma.ExpenseWhereInput = {};
    if (vehicleId) where.vehicleId = vehicleId;
    if (q) where.category = { contains: q, mode: 'insensitive' };
    const orderBy = buildOrderBy(sort, ['category', 'amount', 'date'], {
      date: 'desc',
    });
    const [data, total] = await this.prisma.$transaction([
      this.prisma.expense.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          vehicle: { select: { id: true, regNo: true, name: true } },
        },
      }),
      this.prisma.expense.count({ where }),
    ]);
    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) || 1 },
    };
  }

  /** Cost rollup: total fuel + expense + maintenance cost, optionally per vehicle. */
  async rollup(vehicleId?: string) {
    const fuelWhere: Prisma.FuelLogWhereInput = vehicleId ? { vehicleId } : {};
    const expWhere: Prisma.ExpenseWhereInput = vehicleId ? { vehicleId } : {};
    const maintWhere: Prisma.MaintenanceLogWhereInput = vehicleId
      ? { vehicleId }
      : {};

    const [fuel, expense, maintenance] = await this.prisma.$transaction([
      this.prisma.fuelLog.aggregate({ where: fuelWhere, _sum: { cost: true } }),
      this.prisma.expense.aggregate({
        where: expWhere,
        _sum: { amount: true },
      }),
      this.prisma.maintenanceLog.aggregate({
        where: maintWhere,
        _sum: { cost: true },
      }),
    ]);

    const fuelCost = fuel._sum.cost ?? 0;
    const expenseCost = expense._sum.amount ?? 0;
    const maintenanceCost = maintenance._sum.cost ?? 0;

    return {
      vehicleId: vehicleId ?? null,
      fuelCost,
      expenseCost,
      maintenanceCost,
      operationalCost: fuelCost + maintenanceCost,
      totalCost: fuelCost + expenseCost + maintenanceCost,
    };
  }
}
