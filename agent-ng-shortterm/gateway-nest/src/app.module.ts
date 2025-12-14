import { Module } from '@nestjs/common';
import { AppController } from './routes/app.controller';
import { ProxyController } from './routes/proxy.controller';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule.register({ timeout: 3000 })],
  controllers: [AppController, ProxyController],
})
export class AppModule {}
