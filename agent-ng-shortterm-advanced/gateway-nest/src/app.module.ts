import { Module, CacheModule } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ThrottlerModule } from '@nestjs/throttler';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { AppController } from './routes/app.controller';
import { ProxyController } from './routes/proxy.controller';
import { AuthModule } from './auth/auth.module';
import { ProxyService } from './services/proxy.service';
import * as redisStore from 'cache-manager-ioredis-yet';

@Module({
  import { RootResolver } from './graphql/resolvers';

@Module({
  imports: [
    HttpModule.register({ timeout: 3000 }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    CacheModule.registerAsync({
      useFactory: () => ({
        store: redisStore.create({
          url: process.env.REDIS_URL || 'redis://localhost:6379',
        }),
        ttl: 30, // seconds
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
  controllers: [AppController, ProxyController],
  providers: [ProxyService, RootResolver],
})
export class AppModule {}
