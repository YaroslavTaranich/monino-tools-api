import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { AuthService } from './auth.service';
// import { jwtConstants } from 'src/.secret/jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      // secretOrKey: jwtConstants.secret, // здесь должен быть ваш секретный ключ для подписи токена
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  async validate(payload: any) {
    const { user, password } = payload;
    const userData = await this.authService.validateUser(user, password);
    if (!userData) {
      throw new UnauthorizedException();
    }
    return userData;
  }
}
