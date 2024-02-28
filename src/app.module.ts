import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';
import { Category } from './category/category.model';
import { CategoryModule } from './category/category.module';
import { ToolModule } from './tool/tool.module';
import { Tool } from './tool/tool.model';
import { User } from './user/user.model';
import { AuthModule } from './auth/auth.module';
import { UserService } from './user/user.service';
import { UserModule } from './user/user.module';

@Module({
  controllers: [],
  providers: [],
  imports: [
    ConfigModule.forRoot({
      envFilePath: `.${process.env.NODE_ENV}.env`,
      isGlobal: true,
    }),
    SequelizeModule.forRoot({
      dialect: 'postgres',
      host: process.env.POSTGRES_HOST,
      port: Number(process.env.POSTGRES_PORT),
      username: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      database: process.env.POSTGRES_DB,
      models: [Category, Tool, User],
      autoLoadModels: true,
    }),
    CategoryModule,
    ToolModule,
    AuthModule,
    UserModule,
    AuthModule,
  ],
})
export class AppModule {}
