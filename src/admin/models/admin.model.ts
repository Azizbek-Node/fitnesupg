import { ApiProperty } from '@nestjs/swagger';
import { Column, DataType, Model, Table } from 'sequelize-typescript';

interface IAdminCreationAttr {
  name: string;
  email: string;
  password: string;
  refresh_token: string;
  is_active: boolean;
  is_creator: boolean;
}

@Table({ tableName: 'admin', timestamps: false })
export class Admin extends Model<Admin, IAdminCreationAttr> {
  @ApiProperty({
    example: 1,
    description: 'Admin ID',
  })
  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  })
  id: number;

  @ApiProperty({
    example: 'admin',
    description: "Admin's name",
  })
  @Column({
    type: DataType.STRING(100),
  })
  name: string;

  @ApiProperty({
    example: 'admin123',
    description: "Admin's login",
  })
  @Column({
    type: DataType.STRING(100),
    unique: true,
  })
  email: string;

  @ApiProperty({
    example: 'adminpassword',
    description: "Admin's hashed password,it will be hash in the backend",
  })
  @Column({
    type: DataType.STRING(1000),
  })
  password: string;

  @ApiProperty({
    example: true,
    description:
      "Admin's status(active,not active - boolean(true,false),defaultValue-false)",
  })
  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  is_active: boolean;

  @ApiProperty({
    example: true,
    description:
      "Admin's creator status(admin,not admin - boolean(true,false),defaultValue-false)",
  })
  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  is_creator: boolean;

  @ApiProperty({
    example: 'refresh_token',
    description: 'Admin refresh token',
  })
  @Column({
    type: DataType.STRING,
  })
  refresh_token: string;
}

export default Admin;
