import {
  Allow,
  IsInt,
  Length,
  Min,
  IsOptional,
  IsBoolean,
  IsArray,
  ArrayUnique,
  ArrayMaxSize,
} from 'class-validator';

export class CreateToolDto {
  @Length(4, 50, { message: 'Label должен быть от 4 до 50 символов' })
  readonly label;

  @Length(4, 50, {
    message: 'Название инструмента должен быть от 4 до 50 символов',
  })
  readonly name;

  @Length(4, 100, {
    message: 'Заголовок инструмента должен быть от 4 до 100 символов',
  })
  readonly title;

  @Length(4, 1000, {
    message: 'Описание инструмента должно быть от 4 до 1000 символов',
  })
  readonly description;

  @Length(4, 1000, {
    message:
      'Описание характеристик инструмента должно быть от 4 до 1000 символов',
  })
  readonly specification;

  @Length(4, 100, {
    message: 'Заголовок HTML должен быть от 4 до 100 символов',
  })
  readonly html_title;

  @Length(4, 120, {
    message: 'Описание HTML должно быть от 4 до 120 символов',
  })
  readonly html_description;

  @Allow()
  readonly price;

  @Allow()
  readonly zalog;

  @Allow()
  readonly popular;

  @IsInt({ message: 'Необходимо выбрать тип инструмента' })
  @Min(1, { message: 'Необходимо выбрать тип инструмента' })
  readonly tool_type_id: number;

  @IsOptional()
  @IsBoolean()
  readonly accessory_only?: boolean;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @ArrayMaxSize(100)
  @IsInt({ each: true })
  @Min(1, { each: true })
  readonly related_tool_ids?: number[];

  @Allow()
  readonly categoryId;
}
