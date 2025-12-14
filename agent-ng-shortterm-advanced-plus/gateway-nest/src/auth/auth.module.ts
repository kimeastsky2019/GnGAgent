import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy';
import { ApiKeyGuard } from './apikey.guard';
import { AuthService } from './auth.service';
import { RolesGuard } from './roles.guard';
import { BlacklistService } from './blacklist.service';
import { AuthController } from './auth.controller';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET || 'changeme',
      signOptions: { expiresIn: '1h' },
    }),
  ],
  controllers: [AuthController],
  providers: [JwtStrategy, ApiKeyGuard, RolesGuard, BlacklistService, AuthService],
  exports: [ApiKeyGuard, RolesGuard, AuthService],
})
export class AuthModule {}
