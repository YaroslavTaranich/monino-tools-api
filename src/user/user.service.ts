import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { User } from './user.model';
import { CreateUserDto } from './dto/create-user.dto';
import { validate } from 'class-validator';
import { UpdateUserDto } from './dto/update-user.dto';

const attributes = [
  'id',
  'name',
  'first_name',
  'last_name',
  'phone',
  'email',
  'role',
  'avatar',
];

@Injectable()
export class UserService {
  constructor(@InjectModel(User) private UserRepository: typeof User) {}

  async getAllUsers() {
    return await this.UserRepository.findAll({ attributes });
  }

  async getUserByUsername(username: string) {
    const user = await this.UserRepository.findOne({
      where: { name: username },
      attributes,
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
      attributes,
    });
    if (!user) {
      throw new NotFoundException(`Пользователя с id '${id}' не существует.`);
    }
    return user;
  }

  async createUser(dto: CreateUserDto) {
    try {
      return await this.UserRepository.create(dto);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async updateUserById(id: number, newData: UpdateUserDto) {
    const existingUser = await this.UserRepository.findOne({
      where: { name: newData.name },
    });

    if (existingUser && existingUser.id != id) {
      throw new BadRequestException(
        'Пользователь с ником ' +
          newData.name +
          ' уже существует! Выберите дрогой ник',
      );
    }

    const currentUser = await this.getUserById(id);

    const updateDto = Object.assign(new UpdateUserDto(), newData);

    const errors = await validate(updateDto, { skipMissingProperties: true });
    if (errors.length > 0) {
      const errorMessage = errors
        .map((error) => Object.values(error.constraints))
        .join(', ');
      throw new BadRequestException(errorMessage);
    }
    currentUser.set(newData);
    await currentUser.save();
    return currentUser;
  }
}
