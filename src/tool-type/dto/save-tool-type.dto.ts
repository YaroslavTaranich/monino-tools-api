import {
  IsBoolean,
  IsInt,
  IsString,
  Length,
  Matches,
  Min,
} from 'class-validator';

export class SaveToolTypeDto {
  @IsString()
  @Length(2, 80)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Slug может содержать строчные латинские буквы, цифры и дефисы',
  })
  readonly slug: string;

  @IsString()
  @Length(2, 80)
  readonly name: string;

  @IsInt()
  @Min(0)
  readonly sort_order: number;

  @IsBoolean()
  readonly is_active: boolean;
}
