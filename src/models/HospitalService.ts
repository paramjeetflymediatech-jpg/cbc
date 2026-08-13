import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '@/lib/db';

export interface HospitalServiceAttributes {
  id: number;
  hospitalId: number;
  serviceId: number;
  startingPrice?: number | null;
  description?: string | null;
  treatmentDetails?: string | null;
  subServices?: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt?: Date;
  updatedAt?: Date;
}

export type HospitalServiceCreationAttributes = Optional<HospitalServiceAttributes, 'id' | 'status'>;

export class HospitalService
  extends Model<HospitalServiceAttributes, HospitalServiceCreationAttributes>
  implements HospitalServiceAttributes
{
  declare id: number;
  declare hospitalId: number;
  declare serviceId: number;
  declare startingPrice: number | null;
  declare description: string | null;
  declare treatmentDetails: string | null;
  declare subServices: string | null;
  declare status: 'ACTIVE' | 'INACTIVE';
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

HospitalService.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    hospitalId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    serviceId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    startingPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    treatmentDetails: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    subServices: {
      type: DataTypes.TEXT,
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
    tableName: 'hospital_services',
    timestamps: true,
  }
);
