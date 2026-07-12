import {
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  MinLength,
} from 'class-validator';

export class CreateTripDto {
  @IsString()
  @MinLength(1)
  source: string;

  @IsString()
  @MinLength(1)
  destination: string;

  @IsUUID()
  vehicleId: string;

  @IsUUID()
  driverId: string;

  @IsNumber()
  @Min(0, { message: 'cargoWeight must be >= 0' })
  cargoWeight: number;

  @IsNumber()
  @Min(0, { message: 'plannedDistance must be >= 0' })
  plannedDistance: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  revenue?: number;
}
