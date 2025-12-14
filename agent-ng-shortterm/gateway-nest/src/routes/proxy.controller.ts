import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

const env = (k: string, d?: string) => process.env[k] || d || '';

@Controller()
export class ProxyController {
  constructor(private readonly http: HttpService) {}

  @Get('probe')
  async probe() {
    const url = `${env('DT_URL')}/health`;
    const r$ = this.http.get(url);
    const r = await firstValueFrom(r$);
    return { dt: r.data };
  }

  // ---- Pass-through routes (minimal set) ----
  @Post('plan/optimize')
  async planOptimize(@Body() body: any) {
    const r = await firstValueFrom(this.http.post(`${env('EOP_URL')}/plan/optimize`, body));
    return r.data;
  }

  @Post('forecast/:type')
  async forecast(@Body() body: any, @Query('type') type: 'load'|'pv'|'price' = 'load') {
    const url = `${env('FORECAST_URL')}/forecast/${type}`;
    const r = await firstValueFrom(this.http.post(url, body));
    return r.data;
  }
}
