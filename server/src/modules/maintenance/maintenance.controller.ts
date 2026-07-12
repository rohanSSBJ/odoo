import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { MaintenanceService } from './maintenance.service';
import { CreateMaintenanceDto } from './dto/create-maintenance.dto';
import { CloseMaintenanceDto } from './dto/close-maintenance.dto';
import { QueryMaintenanceDto } from './dto/query-maintenance.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('maintenance')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MaintenanceController {
  constructor(private readonly maintenanceService: MaintenanceService) {}

  @Get()
  findAll(@Query() query: QueryMaintenanceDto) {
    return this.maintenanceService.findAll(query);
  }

  @Post()
  @Roles(Role.FLEET_MANAGER)
  open(@Body() dto: CreateMaintenanceDto) {
    return this.maintenanceService.open(dto);
  }

  @Post(':id/close')
  @Roles(Role.FLEET_MANAGER)
  close(@Param('id') id: string, @Body() dto: CloseMaintenanceDto) {
    return this.maintenanceService.close(id, dto);
  }
}
