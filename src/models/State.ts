import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '@/lib/db';

export interface StateAttributes {
  id: number;
  name: string;
  code?: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt?: Date;
  updatedAt?: Date;
}

export type StateCreationAttributes = Optional<StateAttributes, 'id' | 'status'>;

export class State extends Model<StateAttributes, StateCreationAttributes> implements StateAttributes {
  declare id: number;
  declare name: string;
  declare code: string | null;
  declare status: 'ACTIVE' | 'INACTIVE';
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

State.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
    code: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('ACTIVE', 'INACTIVE'),
      allowNull: false,
      defaultValue: 'ACTIVE',
    },
  },
  {
    sequelize,
    tableName: 'states',
    timestamps: true,
  }
);
