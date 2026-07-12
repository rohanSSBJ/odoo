import { IsNumber, IsOptional, Min } from 'class-validator';

export class CompleteTripDto {
  @IsNumber()
  @Min(0)
  finalOdometer: number;

  @IsNumber()
  @Min(0)
  fuelConsumed: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  revenue?: number;
}
