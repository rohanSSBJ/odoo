import {
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  MinLength,
} from 'class-validator';

export class CreateExpenseDto {
  @IsUUID()
  vehicleId: string;

  @IsString()
  @MinLength(1)
  category: string;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsOptional()
  @IsDateString()
  date?: string;
}
