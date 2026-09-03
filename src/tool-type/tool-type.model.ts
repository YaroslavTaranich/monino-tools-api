import { Column, DataType, HasMany, Model, Table } from 'sequelize-typescript';
import { Tool } from '../tool/tool.model';

export interface ToolTypeCreationAttributes {
  slug: string;
  name: string;
  sort_order?: number;
  is_active?: boolean;
}

@Table({ tableName: 'tool_types' })
export class ToolType extends Model<ToolType, ToolTypeCreationAttributes> {
  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  })
  id: number;

  @Column({
    type: DataType.STRING,
    unique: true,
    allowNull: false,
  })
  slug: string;

  @Column({
    type: DataType.STRING,
    unique: true,
    allowNull: false,
  })
  name: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
  })
  sort_order: number;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  })
  is_active: boolean;

  @HasMany(() => Tool, 'tool_type_id')
  tools: Tool[];
}
