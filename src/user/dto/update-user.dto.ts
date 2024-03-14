import { IsEmail, IsPhoneNumber, Length } from 'class-validator';
import { USER_ROLE } from '../user.model';

export class UpdateUserDto {
  @Length(4, 50, {
    message: 'Имя пользователя должно быть от 4 до 50 символов',
  })
  readonly name: string;

  readonly role: USER_ROLE;

  readonly first_name?: string;

  readonly last_name?: string;

  @IsEmail({}, { message: 'Должен быть корректный адресс электронной почты' })
  readonly email?: string;

  @IsPhoneNumber('RU', { message: 'Должен быть корректный номер' })
  readonly phone?: string;

  readonly avatar?: string;
}
