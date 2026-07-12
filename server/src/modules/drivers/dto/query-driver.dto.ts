import { IsEnum, IsOptional } from 'class-validator';
import { DriverStatus } from '@prisma/client';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class QueryDriverDto extends PaginationDto {
  @IsOptional()
  @IsEnum(DriverStatus)
  status?: DriverStatus;
}
