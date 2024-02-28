import { Column, DataType, Model, Table } from 'sequelize-typescript';

export enum USER_ROLE {
  USER = 'user',
  ADMIN = 'admin',
}

interface CreateUserAtrr {
  name: string;
  first_name?: string;
  last_name?: string;
  password: string;
  email?: string;
  phone?: string;
  role?: USER_ROLE;
  avatar?: string;
}

@Table({ tableName: 'user' })
export class User extends Model<User, CreateUserAtrr> {
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
    unique: false,
    allowNull: true,
  })
  role: USER_ROLE;

  @Column({
    type: DataType.STRING,
    unique: false,
    allowNull: true,
  })
  first_name: string;

  @Column({
    type: DataType.STRING,
    unique: false,
    allowNull: true,
  })
  last_name: string;

  @Column({
    type: DataType.STRING,
    unique: false,
    allowNull: true,
  })
  password: string;

  @Column({
    type: DataType.STRING,
    unique: false,
    allowNull: true,
  })
  email: string;

  @Column({
    type: DataType.STRING,
    unique: false,
    allowNull: true,
  })
  phone: string;

  @Column({
    type: DataType.STRING,
    unique: false,
    allowNull: true,
  })
  avatar: string;
}
