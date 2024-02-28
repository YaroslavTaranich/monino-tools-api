import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy';
import { AuthService } from './auth.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { User } from '../user/user.model';
import { AuthController } from './auth.controller';
import { jwtConstants } from 'src/.secret/jwt';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from './auth.guard';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      global: true,
      secret: jwtConstants.secret, // здесь должен быть ваш секретный ключ для подписи токена
      signOptions: { expiresIn: '1d' }, // время жизни токена
    }),
    SequelizeModule.forFeature([User]),
  ],
  providers: [
    AuthService,
    JwtStrategy,
    { provide: APP_GUARD, useClass: AuthGuard },
  ],
  exports: [PassportModule, JwtModule, AuthService],
  controllers: [AuthController],
})
export class AuthModule {}
