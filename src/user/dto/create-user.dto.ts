import {
  IsEmail,
  IsPhoneNumber,
  IsStrongPassword,
  Length,
} from 'class-validator';
import { USER_ROLE } from '../user.model';

export class CreateUserDto {
  @Length(4, 50, {
    message: 'Имя пользователя должно быть от 4 до 50 символов',
  })
  readonly name: string;

  readonly role: USER_ROLE;

  @Length(4, 50, {
    message: 'Имя должно быть от 4 до 50 символов',
  })
  readonly first_name?: string;
  @Length(4, 100, {
    message: 'Фамилия пользователя должно быть от 4 до 50 символов',
  })
  readonly last_name?: string;

  @IsStrongPassword(
    {
      minLength: 6,
      minLowercase: 1,
      minNumbers: 1,
      minUppercase: 1,
      minSymbols: 1,
    },
    {
      message:
        'Слишком слабый пароль. Пароль должен содержать буквы в верхнем и нижнем регистре и хотя бы одну цифру и символ',
    },
  )
  readonly password: string;

  @IsEmail({}, { message: 'Должен быть корректный адресс электронной почты' })
  readonly email?: string;

  @IsPhoneNumber('RU', { message: 'Должен быть корректный номер' })
  readonly phone?: string;

  readonly avatar?: string;
}
