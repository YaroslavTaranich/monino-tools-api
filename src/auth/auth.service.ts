import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from '../user/user.model';
import * as bcrypt from 'bcrypt';
import { InjectModel } from '@nestjs/sequelize';
import { USER_ROLE } from '../user/user.model';
import { createSessionVersion, toAdminProfile } from './auth.utils';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    @InjectModel(User) private userRepository: typeof User,
  ) {}

  async login(name: string, password: string) {
    const admin = await this.userRepository.findOne({
      where: { name, role: USER_ROLE.ADMIN },
    });
    if (
      !admin ||
      !admin.password ||
      !(await bcrypt.compare(password, admin.password))
    ) {
      throw new UnauthorizedException('Неверный логин или пароль');
    }
    const payload = {
      sub: admin.id,
      role: USER_ROLE.ADMIN,
      sessionVersion: createSessionVersion(admin.password),
    };
    const token = await this.jwtService.signAsync(payload);
    return { token, user: toAdminProfile(admin) };
  }

  async changePassword(
    adminId: number,
    oldPassword: string,
    newPassword: string,
  ) {
    if (oldPassword === newPassword) {
      throw new BadRequestException(
        'Новый пароль должен отличаться от старого',
      );
    }
    const admin = await this.userRepository.findOne({
      where: { id: adminId, role: USER_ROLE.ADMIN },
    });
    if (
      !admin ||
      !admin.password ||
      !(await bcrypt.compare(oldPassword, admin.password))
    ) {
      throw new UnauthorizedException('Неверный пароль');
    }
    admin.password = await bcrypt.hash(newPassword, 12);
    await admin.save();
  }
}
