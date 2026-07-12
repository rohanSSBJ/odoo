import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CloseMaintenanceDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  cost?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
