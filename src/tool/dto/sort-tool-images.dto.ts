import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsInt,
  Min,
} from 'class-validator';

export class SortToolImagesDto {
  @IsArray()
  @ArrayUnique()
  @ArrayMaxSize(5)
  @IsInt({ each: true })
  @Min(1, { each: true })
  readonly image_ids: number[];
}
