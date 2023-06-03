import {
  Model,
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Table,
} from 'sequelize-typescript';
import { Category } from 'src/category/category.model';

interface ToolCreationAtrr {
  name: string;
  label: string;
  title: string;
  html_title: string;
  description: string;
  specification: string;
  html_description: string;
  image: string;
  price: number;
  zalog: number;
  tool_type: string;
  pobular: boolean;
  categoryId: number;
}

@Table({ tableName: 'tools' })
export class Tool extends Model<Tool, ToolCreationAtrr> {
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
    type: DataType.TEXT({ length: 'long' }),
    unique: false,
    allowNull: false,
  })
  specification: string;

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

  @Column({
    type: DataType.INTEGER,
    unique: false,
    allowNull: false,
  })
  price: number;

  @Column({
    type: DataType.INTEGER,
    unique: false,
    allowNull: false,
  })
  zalog: number;

  @Column({
    type: DataType.STRING,
    unique: false,
    allowNull: false,
  })
  tool_type: string;

  @Column({
    type: DataType.BOOLEAN,
    unique: false,
    allowNull: true,
  })
  popular: boolean;

  @ForeignKey(() => Category)
  @Column
  categoryId: number;

  @BelongsTo(() => Category)
  category: Category;
}
