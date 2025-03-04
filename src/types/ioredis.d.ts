declare module 'cache-manager-ioredis-yet' {
  import { Store, Config } from 'cache-manager';
  
  interface RedisStore extends Store {
    name: 'redis';
    getClient: () => any;
    isCacheableValue: (value: any) => boolean;
  }

  interface RedisConfig extends Config {
    host: string;
    port: number;
    password?: string;
    db?: number;
    ttl?: number;
  }

  const redisStore: RedisStore;
  export = redisStore;
}