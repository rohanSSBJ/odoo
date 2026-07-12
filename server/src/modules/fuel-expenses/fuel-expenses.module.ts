import { Module } from '@nestjs/common';
import { FuelExpensesService } from './fuel-expenses.service';
import {
  FuelLogsController,
  ExpensesController,
} from './fuel-expenses.controller';

@Module({
  controllers: [FuelLogsController, ExpensesController],
  providers: [FuelExpensesService],
  exports: [FuelExpensesService],
})
export class FuelExpensesModule {}
