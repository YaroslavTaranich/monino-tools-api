import {
  IsBoolean,
  IsInt,
  IsString,
  Length,
  Matches,
  Min,
} from 'class-validator';

export class SaveToolTypeDto {
  @IsString({ message: 'Системный код должен быть строкой' })
  @Length(2, 80, {
    message: 'Системный код должен содержать от 2 до 80 символов',
  })
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message:
      'Системный код может содержать только строчные латинские буквы, цифры и дефисы',
  })
  readonly slug: string;

  @IsString({ message: 'Название должно быть строкой' })
  @Length(2, 80, {
    message: 'Название должно содержать от 2 до 80 символов',
  })
  readonly name: string;

  @IsInt({ message: 'Порядок отображения должен быть целым числом' })
  @Min(0, { message: 'Порядок отображения не может быть отрицательным' })
  readonly sort_order: number;

  @IsBoolean({ message: 'Признак активности должен быть логическим значением' })
  readonly is_active: boolean;
}
