import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
} from 'class-validator';
import { DriverStatus } from '@prisma/client';

export class UpdateDriverDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  licenseNo?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  licenseCategory?: string;

  @IsOptional()
  @IsDateString()
  licenseExpiry?: string;

  @IsOptional()
  @IsString()
  contact?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  safetyScore?: number;

  @IsOptional()
  @IsEnum(DriverStatus)
  status?: DriverStatus;
}
