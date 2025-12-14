import { Body, Controller, Post, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { BlacklistService } from './blacklist.service';
import { randomUUID } from 'crypto';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService, private readonly bl: BlacklistService) {}

  @Post('login')
  login(@Body() body: any) {
    // demo only
    const { userId = 'demo', roles = ['viewer'] } = body || {};
    const jti = randomUUID();
    const token = this.auth.issueToken(userId, { roles, jti });
    return { token };
  }

  @Post('logout')
  async logout(@Req() req: any) {
    // expects bearer token injected by guard already; parse payload from req.user
    const user = req.user;
    const auth = req.headers['authorization'] || '';
    const exp = (typeof user?.exp === 'number') ? user.exp : Math.floor(Date.now()/1000) + 3600;
    const jti = user?.jti;
    if (jti) await this.bl.blacklist(jti, exp);
    return { ok: true };
  }
}
