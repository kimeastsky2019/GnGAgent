import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiKeyGuard } from '../auth/apikey.guard';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { ProxyService } from '../services/proxy.service';
import { ForecastDto } from '../dto/forecast.dto';
import { PlanOptimizeDto } from '../dto/plan.dto';

const env = (k: string, d?: string) => process.env[k] || d || '';

@Controller()
export class ProxyController {
  constructor(private readonly proxy: ProxyService) {}

  @Get('probe')
  async probe() {
    return { dt: await this.proxy.health(`${env('DT_URL')}/health`) };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin','planner')
  @Post('plan/optimize')
  async planOptimize(@Body() body: PlanOptimizeDto) {
    return await this.proxy.post(`${env('EOP_URL')}/plan/optimize`, body);
  }

  @UseGuards(ApiKeyGuard)
  @Post('forecast/:type')
  async forecast(@Param('type') type: 'load'|'pv'|'price', @Body() body: ForecastDto) {
    return await this.proxy.cachedPost(`${env('FORECAST_URL')}/forecast/${type}`, body);
  }
}
