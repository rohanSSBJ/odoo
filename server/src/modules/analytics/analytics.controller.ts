import { Controller, Get, Header, Query, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('kpis')
  kpis() {
    return this.analyticsService.kpis();
  }

  @Get('reports')
  async reports(
    @Query('format') format: string | undefined,
    @Res({ passthrough: true }) res: Response,
  ) {
    if ((format ?? 'csv').toLowerCase() === 'csv') {
      const csv = await this.analyticsService.reportCsv();
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader(
        'Content-Disposition',
        'attachment; filename="transitops-vehicle-report.csv"',
      );
      return res.send(csv);
    }
    return this.analyticsService.vehicleReport();
  }
}
