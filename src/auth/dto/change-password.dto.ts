import { IsString, IsStrongPassword, Length } from 'class-validator';

export class ChangePasswordDto {
  @IsString()
  @Length(1, 200)
  readonly oldPassword: string;

  @IsStrongPassword({
    minLength: 10,
    minLowercase: 1,
    minUppercase: 1,
    minNumbers: 1,
    minSymbols: 1,
  })
  readonly newPassword: string;
}
