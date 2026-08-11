import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '@/lib/db';

export interface LeadPackageAttributes {
  id: number;
  name: string;
  leadCount: number;
  price: number;
  currency: string;
  validityDays?: number | null;
  description?: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt?: Date;
  updatedAt?: Date;
}

export type LeadPackageCreationAttributes = Optional<LeadPackageAttributes, 'id' | 'status' | 'currency'>;

export class LeadPackage extends Model<LeadPackageAttributes, LeadPackageCreationAttributes> implements LeadPackageAttributes {
  declare id: number;
  declare name: string;
  declare leadCount: number;
  declare price: number;
  declare currency: string;
  declare validityDays: number | null;
  declare description: string | null;
  declare status: 'ACTIVE' | 'INACTIVE';
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

LeadPackage.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    leadCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    currency: {
      type: DataTypes.STRING(10),
      allowNull: false,
      defaultValue: 'INR',
    },
    validityDays: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    description: {
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
    tableName: 'lead_packages',
    timestamps: true,
  }
);
