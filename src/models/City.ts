import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '@/lib/db';

export interface CityAttributes {
  id: number;
  stateId: number;
  name: string;
  isPopular?: boolean;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt?: Date;
  updatedAt?: Date;
}

export type CityCreationAttributes = Optional<CityAttributes, 'id' | 'isPopular' | 'status'>;

export class City extends Model<CityAttributes, CityCreationAttributes> implements CityAttributes {
  declare id: number;
  declare stateId: number;
  declare name: string;
  declare isPopular: boolean;
  declare status: 'ACTIVE' | 'INACTIVE';
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

City.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    stateId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'states',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    isPopular: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    status: {
      type: DataTypes.ENUM('ACTIVE', 'INACTIVE'),
      allowNull: false,
      defaultValue: 'ACTIVE',
    },
  },
  {
    sequelize,
    tableName: 'cities',
    timestamps: true,
  }
);
