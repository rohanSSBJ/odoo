import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  PaginatedResult,
  buildOrderBy,
} from '../../common/dto/pagination.dto';
import { CreateDriverDto } from './dto/create-driver.dto';
import { UpdateDriverDto } from './dto/update-driver.dto';
import { QueryDriverDto } from './dto/query-driver.dto';

const SORTABLE = [
  'name',
  'licenseNo',
  'licenseCategory',
  'licenseExpiry',
  'safetyScore',
  'status',
  'createdAt',
];

@Injectable()
export class DriversService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: QueryDriverDto): Promise<PaginatedResult<any>> {
    const { page, limit, q, sort, status } = query;

    const where: Prisma.DriverWhereInput = {};
    if (status) where.status = status;
    if (q) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { licenseNo: { contains: q, mode: 'insensitive' } },
        { licenseCategory: { contains: q, mode: 'insensitive' } },
      ];
    }

    const orderBy = buildOrderBy(sort, SORTABLE, { createdAt: 'desc' });

    const [data, total] = await this.prisma.$transaction([
      this.prisma.driver.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.driver.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) || 1 },
    };
  }

  async findOne(id: string) {
    const driver = await this.prisma.driver.findUnique({ where: { id } });
    if (!driver) throw new NotFoundException('Driver not found');
    return driver;
  }

  async create(dto: CreateDriverDto) {
    return this.prisma.driver.create({
      data: { ...dto, licenseExpiry: new Date(dto.licenseExpiry) },
    });
  }

  async update(id: string, dto: UpdateDriverDto) {
    await this.findOne(id);
    const data: Prisma.DriverUpdateInput = { ...dto };
    if (dto.licenseExpiry) data.licenseExpiry = new Date(dto.licenseExpiry);
    return this.prisma.driver.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.driver.delete({ where: { id } });
    return { deleted: true, id };
  }
}
