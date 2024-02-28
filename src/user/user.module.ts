import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { User } from './user.model';
import { SequelizeModule } from '@nestjs/sequelize';
import { UserController } from './user.controller';

@Module({
  providers: [UserService],
  exports: [UserService],
  imports: [SequelizeModule.forFeature([User])],
  controllers: [UserController],
})
export class UserModule {}
