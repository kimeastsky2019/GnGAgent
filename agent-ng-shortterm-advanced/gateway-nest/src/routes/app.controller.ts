import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiKeyGuard } from '../auth/apikey.guard';
import { JwtAuthGuard } from '../auth/jwt.guard';

@Controller()
export class AppController {
  @Get('health')
  health() {
    return { service: 'gateway-nest-adv', status: 'ok', ts: new Date().toISOString() };
  }

  // Example of protected endpoint accepting either guard (demo-friendly):
  @UseGuards(JwtAuthGuard)
  @Get('protected/jwt')
  jwtProtected() {
    return { ok: true, by: 'jwt' };
  }

  @UseGuards(ApiKeyGuard)
  @Get('protected/apikey')
  apikeyProtected() {
    return { ok: true, by: 'apikey' };
  }
}
