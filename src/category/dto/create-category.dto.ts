import { Length } from 'class-validator';

export class CreateCategoryDto {
  @Length(4, 50, { message: 'Label должен быть от 4 до 50 символов' })
  readonly label;

  @Length(4, 50, {
    message: 'Название категории должен быть от 4 до 50 символов',
  })
  readonly name;
  @Length(4, 100, {
    message: 'Заголовок категории должен быть от 4 до 100 символов',
  })
  readonly title;
  @Length(4, 1000, {
    message: 'Описание категории должен быть от 4 до 1000 символов',
  })
  readonly description;
  @Length(4, 100, {
    message: 'Заголовок HTML должен быть от 4 до 100 символов',
  })
  readonly html_title;
  @Length(4, 120, {
    message: 'Описание HTML должно быть от 4 до 120 символов',
  })
  readonly html_description;

  readonly image;
}
