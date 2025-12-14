import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { BlacklistService } from './blacklist.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly blacklist: BlacklistService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'changeme',
      passReqToCallback: true
    });
  }
  async validate(req: any, payload: any) {
    const jti = payload.jti;
    if (jti && await this.blacklist.isBlacklisted(jti)) {
      throw new UnauthorizedException('Token revoked');
    }
    return { sub: payload.sub, roles: payload.roles || [], jti };
  }
}
