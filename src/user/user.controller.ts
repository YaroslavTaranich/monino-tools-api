import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
  constructor(private userService: UserService) {}
  @Put(':id')
  updateOne(@Param('id') id: number, @Body() dto: CreateUserDto) {
    return this.userService.updateUserById(id, dto);
  }

  @Post()
  createOne(@Body() dto: CreateUserDto) {
    return this.userService.createUser(dto);
  }

  @Get()
  getAll() {
    return this.userService.getAllUsers();
  }

  @Get(':name')
  getByName(name: string) {
    return this.getByName(name);
  }
}
