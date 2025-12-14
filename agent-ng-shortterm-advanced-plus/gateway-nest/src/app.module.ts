import { Module, CacheModule } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ThrottlerModule } from '@nestjs/throttler';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { AppController } from './routes/app.controller';
import { ProxyController } from './routes/proxy.controller';
import { MetricsController } from './metrics.controller';
import { AuthModule } from './auth/auth.module';
import { ProxyService } from './services/proxy.service';
import * as redisStore from 'cache-manager-ioredis-yet';
import { RootResolver } from './graphql/resolvers';

const ttl = parseInt(process.env.THROTTLE_TTL_MS || '60000', 10);
const limit = parseInt(process.env.THROTTLE_LIMIT || '120', 10);

@Module({
  imports: [
    HttpModule.register({ timeout: 3000 }),
    ThrottlerModule.forRoot([{ ttl, limit }]),
    CacheModule.registerAsync({
      useFactory: () => ({
        store: redisStore.create({
          url: process.env.REDIS_URL || 'redis://localhost:6379',
        }),
        ttl: 30,
        max: 1000,
      }),
      isGlobal: true,
    }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: true,
      sortSchema: true,
      playground: true,
      path: '/graphql',
    }),
    AuthModule,
  ],
  controllers: [AppController, ProxyController, MetricsController],
  providers: [ProxyService, RootResolver],
})
export class AppModule {}
