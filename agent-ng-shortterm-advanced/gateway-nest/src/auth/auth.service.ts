import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(private readonly jwt: JwtService) {}

  issueToken(sub: string, claims: Record<string, any> = {}) {
    return this.jwt.sign({ sub, ...claims });
  }
}
