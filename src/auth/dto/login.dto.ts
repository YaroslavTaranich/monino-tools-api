import { IsString, Length } from 'class-validator';

export class LoginDto {
  @IsString()
  @Length(1, 100)
  readonly name: string;

  @IsString()
  @Length(1, 200)
  readonly password: string;
}
