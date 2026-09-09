import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';
import { Tool } from './tool.model';

interface ToolImageCreationAttributes {
  tool_id: number;
  storage_key: string;
  sort_order: number;
  is_cover: boolean;
  alt?: string;
  mime_type?: string;
  size?: number;
}

@Table({ tableName: 'tool_images', timestamps: false })
export class ToolImage extends Model<ToolImage, ToolImageCreationAttributes> {
  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  })
  id: number;

  @ForeignKey(() => Tool)
  @Column({ type: DataType.INTEGER, allowNull: false })
  tool_id: number;

  @BelongsTo(() => Tool)
  tool: Tool;

  @Column({ type: DataType.STRING, allowNull: false })
  storage_key: string;

  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 0 })
  sort_order: number;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
  is_cover: boolean;

  @Column(DataType.STRING)
  alt: string;

  @Column(DataType.STRING)
  mime_type: string;

  @Column(DataType.INTEGER)
  size: number;

  @Column({ type: DataType.DATE, allowNull: false, defaultValue: DataType.NOW })
  created_at: Date;
}
