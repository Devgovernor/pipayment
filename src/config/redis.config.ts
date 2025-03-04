import { RedisOptions } from 'ioredis';
import { ConfigService } from '@nestjs/config';

interface ClusterConfig {
  nodes: string[];
  options: {
    scaleReads: string;
    maxRedirections: number;
    retryDelayOnFailover: number;
  };
}

export const getRedisConfig = (configService: ConfigService): RedisOptions & { cluster?: ClusterConfig } => {
  const clusterNodes = configService.get<string[]>('app.redis.clusterNodes');
  
  return {
    host: configService.get('app.redis.host'),
    port: configService.get('app.redis.port'),
    password: configService.get('app.redis.password'),
    db: 0,
    retryStrategy: (times: number) => {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
    reconnectOnError: (err: Error) => {
      const targetError = 'READONLY';
      if (err.message.includes(targetError)) {
        return true;
      }
      return false;
    },
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    enableOfflineQueue: true,
    connectTimeout: 10000,
    keyPrefix: 'pi-gateway:',
    cluster: configService.get('app.redis.cluster') && clusterNodes ? {
      nodes: clusterNodes,
      options: {
        scaleReads: 'slave',
        maxRedirections: 16,
        retryDelayOnFailover: 100,
      },
    } : undefined,
  };
};