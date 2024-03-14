import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
  constructor(private userService: UserService) {}

  @Put(':id')
  async updateOne(@Param('id') id: number, @Body() dto: CreateUserDto) {
    return await this.userService.updateUserById(id, dto);
  }

  @Post()
  async createOne(@Body() dto: CreateUserDto) {
    return await this.userService.createUser(dto);
  }

  @Get()
  async getAll() {
    return await this.userService.getAllUsers();
  }

  @Get(':id')
  async getByName(@Param('id') name: number) {
    return await this.userService.getUserById(name);
  }
}
