import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { AdminAuthController } from './controllers/admin-auth.controller';
import { SuperAdminController } from './controllers/super-admin.controller';
import { SessionController } from './controllers/session.controller';
import { TwoFactorController } from './controllers/two-factor.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { ApiKeyStrategy } from './strategies/api-key.strategy';
import { SessionService } from './services/session.service';
import { OtpService } from './services/otp.service';
import { TwoFactorService } from './services/two-factor.service';
import { User } from '../database/entities/user.entity';
import { ApiKey } from '../database/entities/api-key.entity';
import { Merchant } from '../database/entities/merchant.entity';
import { Session } from './entities/session.entity';
import { MonitoringModule } from '../monitoring/monitoring.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { ConfigModule as AppConfigModule } from '../config/config.module';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('app.jwt.secret'),
        signOptions: {
          expiresIn: configService.get<string>('app.jwt.expiresIn'),
        },
      }),
    }),
    ThrottlerModule.forRoot([{
      ttl: 60,
      limit: 10,
    }]),
    TypeOrmModule.forFeature([User, ApiKey, Merchant, Session]),
    MonitoringModule,
    NotificationsModule,
    AppConfigModule,
  ],
  controllers: [
    AuthController,
    AdminAuthController,
    SuperAdminController,
    SessionController,
    TwoFactorController,
  ],
  providers: [
    AuthService,
    JwtStrategy,
    ApiKeyStrategy,
    SessionService,
    OtpService,
    TwoFactorService,
  ],
  exports: [AuthService],
})
export class AuthModule {}