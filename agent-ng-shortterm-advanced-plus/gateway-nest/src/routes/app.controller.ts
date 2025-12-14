import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiKeyGuard } from '../auth/apikey.guard';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

@Controller()
export class AppController {
  @Get('health')
  health() {
    return { service: 'gateway-nest-adv-plus', status: 'ok', ts: new Date().toISOString() };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get('protected/admin')
  adminOnly() {
    return { ok: true, by: 'jwt', role: 'admin' };
  }

  @UseGuards(ApiKeyGuard)
  @Get('protected/apikey')
  apikeyProtected() {
    return { ok: true, by: 'apikey' };
  }
}
