import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { User } from '../user/user.model';
import { AuthController } from './auth.controller';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from './auth.guard';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LoginRateLimitService } from './login-rate-limit.service';

@Module({
  imports: [
    ConfigModule,
    JwtModule.registerAsync({
      global: true,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: { expiresIn: '8h' },
      }),
    }),
    SequelizeModule.forFeature([User]),
  ],
  providers: [
    AuthService,
    LoginRateLimitService,
    { provide: APP_GUARD, useClass: AuthGuard },
  ],
  exports: [JwtModule, AuthService],
  controllers: [AuthController],
})
export class AuthModule {}
