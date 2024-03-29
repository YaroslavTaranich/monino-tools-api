import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Post,
  Put,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from './auth.guard';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { UserService } from 'src/user/user.service';
import { USER_ROLE } from 'src/user/user.model';
import { Public } from 'src/decorators/Public';

interface IChangePassword {
  name: string;
  oldPassword: string;
  newPassword: string;
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {}

  @Post('reg')
  async register(@Body() userData: CreateUserDto) {
    return this.authService.register(userData);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body() body: { name: string; password: string }) {
    const { name, password } = body;
    return this.authService.login(name, password);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('admin')
  async admin(@Body() body: { name: string; password: string }) {
    const { name, password } = body;
    const user = await this.userService.getUserByUsername(name);
    if (user.role !== USER_ROLE.ADMIN) {
      throw new NotFoundException('Неверное имя пользователя или пароль');
    }
    return this.authService.login(name, password);
  }

  @UseGuards(AuthGuard)
  @Get('profile')
  async getProfile(@Request() req) {
    return await this.userService.getUserByUsername(req.user.username);
  }

  @Put('password')
  async changePassword(
    @Body() { oldPassword, newPassword, name }: IChangePassword,
  ) {
    return await this.authService.changePassword(
      oldPassword,
      newPassword,
      name,
    );
  }
}
