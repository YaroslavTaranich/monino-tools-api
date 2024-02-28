import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from '../user/user.model';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { InjectModel } from '@nestjs/sequelize';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    @InjectModel(User) private userRepository: typeof User,
  ) {}

  async register(userData: CreateUserDto) {
    const existingUser = await this.userRepository.findOne({
      where: { name: userData.name },
    });

    if (existingUser?.name === userData.name) {
      throw new BadRequestException(
        'Пользователь с таким ником уже существует',
      );
    }

    const hashedPass = await bcrypt.hash(userData.password, 10);
    const newUser = await this.userRepository.create({
      ...userData,
      password: hashedPass,
    });
    return newUser;
  }

  async login(name: string, password: string) {
    const user = await this.validateUser(name, password);

    if (!user) {
      throw new UnauthorizedException('Неверный логин или пароль');
    }

    // генерируем JWT-токен для пользователя
    const payload = { username: user.name, sub: user.id };

    const token = await this.jwtService.signAsync(payload);
    return { token };
  }

  async validateUser(name: string, password: string) {
    // Проверка данных пользователя при аутентификации
    const user = await this.userRepository.findOne({ where: { name } });
    if (user && (await this.comparePasswords(password, user.password))) {
      return user;
    }
    return null;
  }

  private async comparePasswords(password: string, hashedPassword: string) {
    const match = await bcrypt.compare(password, hashedPassword);
    console.log('bycript match: ', match);
    return match;
  }
}
