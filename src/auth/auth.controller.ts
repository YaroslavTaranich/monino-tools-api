import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Put,
  Request,
  Response,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public } from '../decorators/Public';
import {
  Request as ExpressRequest,
  Response as ExpressResponse,
} from 'express';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { LoginRateLimitService } from './login-rate-limit.service';

const sessionCookie = 'admin_session';
const cookieBaseOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/',
};
const sessionCookieOptions = {
  ...cookieBaseOptions,
  maxAge: 8 * 60 * 60 * 1000,
};

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly loginRateLimit: LoginRateLimitService,
  ) {}

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(
    @Body() body: LoginDto,
    @Request() request: ExpressRequest,
    @Response({ passthrough: true }) response: ExpressResponse,
  ) {
    const rateLimitKey = request.ip;
    this.loginRateLimit.assertAllowed(rateLimitKey);
    try {
      const { token, user } = await this.authService.login(
        body.name,
        body.password,
      );
      this.loginRateLimit.reset(rateLimitKey);
      response.cookie(sessionCookie, token, sessionCookieOptions);
      return { user };
    } catch (error) {
      this.loginRateLimit.recordFailure(rateLimitKey);
      throw error;
    }
  }

  @Get('profile')
  async getProfile(@Request() req) {
    return req.user;
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Post('logout')
  logout(@Response({ passthrough: true }) response: ExpressResponse) {
    response.clearCookie(sessionCookie, cookieBaseOptions);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Put('password')
  async changePassword(
    @Body() { oldPassword, newPassword }: ChangePasswordDto,
    @Request() request,
    @Response({ passthrough: true }) response: ExpressResponse,
  ) {
    await this.authService.changePassword(
      request.user.id,
      oldPassword,
      newPassword,
    );
    response.clearCookie(sessionCookie, cookieBaseOptions);
  }
}
