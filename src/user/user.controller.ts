import { Body, Controller, Get, Post, Put } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
  constructor(private userService: UserService) {}
  //   @Put(':id')
  //   create(@Body() dto: CreateUserDto) {

  //     return this.userService.createUser(dto);
  //   }

  @Get()
  getAll() {
    return this.userService.getAllUsers();
  }

  @Get(':name')
  getByName(name: string) {
    return this.getByName(name);
  }
}
