import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

export const getTypeOrmConfig = (configService: ConfigService): TypeOrmModuleOptions => ({
  type: 'postgres',
  host: configService.get('app.database.host'),
  port: configService.get('app.database.port'),
  username: configService.get('app.database.username'),
  password: configService.get('app.database.password'),
  database: configService.get('app.database.database'),
  entities: [__dirname + '/**/*.entity{.ts,.js}'],
  synchronize: configService.get('app.environment') !== 'production',
  logging: configService.get('app.environment') !== 'production',
  ssl: {
    ca: configService.get('app.database.ca'),
    rejectUnauthorized: false
  },
  // Performance optimizations
  poolSize: 20,
  maxQueryExecutionTime: 1000,
  cache: {
    type: 'ioredis',
    options: {
      host: configService.get('app.redis.host'),
      port: configService.get('app.redis.port'),
    },
    duration: 60000, // Cache for 1 minute
  },
  extra: {
    max: 20, // Maximum number of clients in the pool
    idleTimeoutMillis: 30000, // How long a client is allowed to remain idle before being closed
    connectionTimeoutMillis: 2000, // How long to wait for a connection
  }
});