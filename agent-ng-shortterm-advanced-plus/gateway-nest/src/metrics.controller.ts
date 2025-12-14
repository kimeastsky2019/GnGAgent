import { Controller, Get } from '@nestjs/common';
import client from 'prom-client';

const registry = new client.Registry();
client.collectDefaultMetrics({ register: registry });

@Controller()
export class MetricsController {
  @Get('metrics')
  async metrics() {
    return registry.metrics();
  }
}
