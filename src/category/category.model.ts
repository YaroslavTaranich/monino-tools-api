import { Column, DataType, Model, Table } from 'sequelize-typescript';

interface CategoryCreationAtrr {
  name: string;
  label: string;
  title: string;
  html_title: string;
  description: string;
  html_description: string;
  picture: string;
}

@Table({ tableName: 'categories' })
export class Category extends Model<Category, CategoryCreationAtrr> {
  @Column({
    type: DataType.INTEGER,
    unique: true,
    autoIncrement: true,
    primaryKey: true,
  })
  id: number;

  @Column({
    type: DataType.STRING,
    unique: true,
    allowNull: false,
  })
  name: string;

  @Column({
    type: DataType.STRING,
    unique: true,
    allowNull: false,
  })
  label: string;

  @Column({
    type: DataType.STRING,
    unique: true,
    allowNull: false,
  })
  title: string;

  @Column({
    type: DataType.TEXT({ length: 'long' }),
    unique: false,
    allowNull: false,
  })
  description: string;

  @Column({
    type: DataType.STRING,
    unique: false,
    allowNull: false,
  })
  html_title: string;

  @Column({
    type: DataType.STRING,
    unique: false,
    allowNull: false,
  })
  html_description: string;

  @Column({
    type: DataType.STRING,
    unique: false,
  })
  image: string;

  //   tools:
}
