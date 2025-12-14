import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get('health')
  health() {
    return { service: 'gateway-nest', status: 'ok', ts: new Date().toISOString() };
  }
}
