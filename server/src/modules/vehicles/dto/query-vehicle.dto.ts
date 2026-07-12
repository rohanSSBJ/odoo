import { IsEnum, IsOptional, IsString } from 'class-validator';
import { VehicleStatus } from '@prisma/client';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class QueryVehicleDto extends PaginationDto {
  @IsOptional()
  @IsEnum(VehicleStatus)
  status?: VehicleStatus;

  @IsOptional()
  @IsString()
  type?: string;
}
