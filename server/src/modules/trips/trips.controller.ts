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
import { TripsService } from './trips.service';
import { CreateTripDto } from './dto/create-trip.dto';
import { CompleteTripDto } from './dto/complete-trip.dto';
import { QueryTripDto } from './dto/query-trip.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import {
  CurrentUser,
  AuthUser,
} from '../../common/decorators/current-user.decorator';

@Controller('trips')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TripsController {
  constructor(private readonly tripsService: TripsService) {}

  @Get()
  findAll(@Query() query: QueryTripDto) {
    return this.tripsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tripsService.findOne(id);
  }

  @Post()
  @Roles(Role.DRIVER, Role.FLEET_MANAGER)
  create(@Body() dto: CreateTripDto, @CurrentUser() user: AuthUser) {
    return this.tripsService.create(dto, user.id);
  }

  @Post(':id/dispatch')
  @Roles(Role.DRIVER, Role.FLEET_MANAGER)
  dispatch(@Param('id') id: string) {
    return this.tripsService.dispatch(id);
  }

  @Post(':id/complete')
  @Roles(Role.DRIVER, Role.FLEET_MANAGER)
  complete(@Param('id') id: string, @Body() dto: CompleteTripDto) {
    return this.tripsService.complete(id, dto);
  }

  @Post(':id/cancel')
  @Roles(Role.DRIVER, Role.FLEET_MANAGER)
  cancel(@Param('id') id: string) {
    return this.tripsService.cancel(id);
  }
}
