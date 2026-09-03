import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/Public';
import { InjectModel } from '@nestjs/sequelize';
import { User, USER_ROLE } from '../user/user.model';
import { createSessionVersion, toAdminProfile } from './auth.utils';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
    @InjectModel(User) private readonly userRepository: typeof User,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromCookie(request);
    if (!token) {
      throw new UnauthorizedException();
    }
    try {
      const payload = await this.jwtService.verifyAsync<{
        sub: number;
        role: USER_ROLE;
        sessionVersion: string;
      }>(token);
      if (payload.role !== USER_ROLE.ADMIN) {
        throw new UnauthorizedException();
      }
      const admin = await this.userRepository.findOne({
        where: { id: payload.sub, role: USER_ROLE.ADMIN },
      });
      if (
        !admin ||
        !admin.password ||
        createSessionVersion(admin.password) !== payload.sessionVersion
      ) {
        throw new UnauthorizedException();
      }
      request['user'] = toAdminProfile(admin);
    } catch {
      throw new UnauthorizedException();
    }
    return true;
  }

  private extractTokenFromCookie(request: Request): string | undefined {
    const cookie = request.headers.cookie;
    if (!cookie) return undefined;
    for (const part of cookie.split(';')) {
      const [name, ...value] = part.trim().split('=');
      if (name === 'admin_session') {
        return decodeURIComponent(value.join('='));
      }
    }
    return undefined;
  }
}
