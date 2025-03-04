import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';
import { CacheService } from './cache.service';
import redisStore from 'cache-manager-ioredis-yet';
import { RedisOptions } from 'ioredis';

@Module({
  imports: [
    NestCacheModule.registerAsync<RedisOptions>({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        store: redisStore,
        host: configService.get('app.redis.host'),
        port: configService.get('app.redis.port'),
        ttl: 60 * 60, // 1 hour default TTL
        max: 1000, // maximum number of items in cache
      }),
    }),
  ],
  providers: [CacheService],
  exports: [CacheService],
})
export class CacheModule {}