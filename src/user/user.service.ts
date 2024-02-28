import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { User } from './user.model';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UserService {
  constructor(@InjectModel(User) private UserRepository: typeof User) {}

  async createUser(dto: CreateUserDto) {
    try {
      const user = await this.UserRepository.create(dto);
      return user;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async getAllUsers() {
    return await this.UserRepository.findAll();
  }

  async getUserByUsername(username: string) {
    const user = await this.UserRepository.findOne({
      where: { name: username },
    });
    if (!user) {
      throw new NotFoundException(
        `Пользователя с ником '${username}' не существует.`,
      );
    }
    return user;
  }
}
