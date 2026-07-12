import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';
import { VehicleStatus } from '@prisma/client';

export class CreateVehicleDto {
  @IsString()
  @MinLength(1)
  regNo: string;

  @IsString()
  @MinLength(1)
  name: string;

  @IsString()
  @MinLength(1)
  type: string;

  @IsNumber()
  @Min(0.01, { message: 'maxLoadKg must be greater than 0' })
  maxLoadKg: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  odometer?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  acquisitionCost?: number;

  @IsOptional()
  @IsEnum(VehicleStatus)
  status?: VehicleStatus;
}
