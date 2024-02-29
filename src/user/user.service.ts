import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { User } from './user.model';
import { CreateUserDto } from './dto/create-user.dto';
import { validate } from 'class-validator';

@Injectable()
export class UserService {
  constructor(@InjectModel(User) private UserRepository: typeof User) {}

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

  async getUserById(id: number) {
    const user = await this.UserRepository.findOne({
      where: { id: id },
    });
    if (!user) {
      throw new NotFoundException(`Пользователя с id '${id}' не существует.`);
    }
    return user;
  }

  async createUser(dto: CreateUserDto) {
    try {
      const user = await this.UserRepository.create(dto);
      return user;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async updateUserById(id: number, newData: CreateUserDto) {
    const currentUser = await this.getUserById(id);

    const updateDto = Object.assign(new CreateUserDto(), newData);

    const errors = await validate(updateDto);
    if (errors.length > 0) {
      const errorMessage = errors
        .map((error) => Object.values(error.constraints))
        .join(', ');
      throw new BadRequestException(errorMessage);
    }

    await currentUser.update(updateDto);

    return currentUser;
  }
}
