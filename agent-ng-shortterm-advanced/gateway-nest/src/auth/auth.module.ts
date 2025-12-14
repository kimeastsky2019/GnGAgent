import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy';
import { ApiKeyGuard } from './apikey.guard';
import { AuthService } from './auth.service';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET || 'changeme',
      signOptions: { expiresIn: '1h' },
    }),
  ],
  providers: [JwtStrategy, ApiKeyGuard, AuthService],
  exports: [ApiKeyGuard, AuthService],
})
export class AuthModule {}
