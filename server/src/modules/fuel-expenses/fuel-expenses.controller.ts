import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { FuelExpensesService } from './fuel-expenses.service';
import { CreateFuelLogDto } from './dto/create-fuel-log.dto';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { QueryFuelExpenseDto } from './dto/query-fuel-expense.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

const WRITE_ROLES = [Role.FINANCIAL_ANALYST, Role.FLEET_MANAGER] as const;

@Controller('fuel-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FuelLogsController {
  constructor(private readonly service: FuelExpensesService) {}

  @Get()
  findAll(@Query() query: QueryFuelExpenseDto) {
    return this.service.findFuelLogs(query);
  }

  @Post()
  @Roles(...WRITE_ROLES)
  create(@Body() dto: CreateFuelLogDto) {
    return this.service.createFuelLog(dto);
  }
}

@Controller('expenses')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ExpensesController {
  constructor(private readonly service: FuelExpensesService) {}

  @Get()
  findAll(@Query() query: QueryFuelExpenseDto) {
    return this.service.findExpenses(query);
  }

  @Get('rollup')
  rollup(@Query('vehicleId') vehicleId?: string) {
    return this.service.rollup(vehicleId);
  }

  @Post()
  @Roles(...WRITE_ROLES)
  create(@Body() dto: CreateExpenseDto) {
    return this.service.createExpense(dto);
  }
}
