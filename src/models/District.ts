import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '@/lib/db';

export interface DistrictAttributes {
  id: number;
  stateId: number;
  name: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt?: Date;
  updatedAt?: Date;
}

export type DistrictCreationAttributes = Optional<DistrictAttributes, 'id' | 'status'>;

export class District extends Model<DistrictAttributes, DistrictCreationAttributes> implements DistrictAttributes {
  declare id: number;
  declare stateId: number;
  declare name: string;
  declare status: 'ACTIVE' | 'INACTIVE';
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

District.init(
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
    status: {
      type: DataTypes.ENUM('ACTIVE', 'INACTIVE'),
      allowNull: false,
      defaultValue: 'ACTIVE',
    },
  },
  {
    sequelize,
    tableName: 'districts',
    timestamps: true,
  }
);
