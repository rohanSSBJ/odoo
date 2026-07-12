import {
  IsDateString,
  IsNumber,
  IsOptional,
  IsUUID,
  Min,
} from 'class-validator';

export class CreateFuelLogDto {
  @IsUUID()
  vehicleId: string;

  @IsOptional()
  @IsUUID()
  tripId?: string;

  @IsNumber()
  @Min(0)
  liters: number;

  @IsNumber()
  @Min(0)
  cost: number;

  @IsOptional()
  @IsDateString()
  date?: string;
}
