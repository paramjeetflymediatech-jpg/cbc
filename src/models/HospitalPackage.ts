import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '@/lib/db';

export interface HospitalPackageAttributes {
  id: number;
  hospitalId: number;
  packageId: number;
  leadLimit: number;
  leadsUsed: number;
  leadsRemaining: number;
  purchasePrice: number;
  currency: string;
  paymentId?: number | null;
  status: 'ACTIVE' | 'EXPIRED';
  purchasedAt: Date;
  expiresAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export type HospitalPackageCreationAttributes = Optional<
  HospitalPackageAttributes,
  'id' | 'status' | 'purchasedAt' | 'leadsUsed' | 'currency'
>;

export class HospitalPackage
  extends Model<HospitalPackageAttributes, HospitalPackageCreationAttributes>
  implements HospitalPackageAttributes
{
  declare id: number;
  declare hospitalId: number;
  declare packageId: number;
  declare leadLimit: number;
  declare leadsUsed: number;
  declare leadsRemaining: number;
  declare purchasePrice: number;
  declare currency: string;
  declare paymentId: number | null;
  declare status: 'ACTIVE' | 'EXPIRED';
  declare purchasedAt: Date;
  declare expiresAt: Date | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

HospitalPackage.init(
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
    packageId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    leadLimit: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    leadsUsed: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    leadsRemaining: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    purchasePrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    currency: {
      type: DataTypes.STRING(10),
      allowNull: false,
      defaultValue: 'INR',
    },
    paymentId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('ACTIVE', 'EXPIRED'),
      allowNull: false,
      defaultValue: 'ACTIVE',
    },
    purchasedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'hospital_packages',
    timestamps: true,
  }
);
