import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '@/lib/db';

export interface LeadTransactionAttributes {
  id: number;
  hospitalId: number;
  packageId?: number | null;
  leadId?: number | null;
  transactionType: 'PACKAGE_PURCHASE' | 'LEAD_CONSUMED' | 'LEAD_REFUND' | 'ADMIN_ADJUSTMENT';
  leadAmount: number;
  balanceBefore: number;
  balanceAfter: number;
  description?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export type LeadTransactionCreationAttributes = Optional<LeadTransactionAttributes, 'id'>;

export class LeadTransaction
  extends Model<LeadTransactionAttributes, LeadTransactionCreationAttributes>
  implements LeadTransactionAttributes
{
  declare id: number;
  declare hospitalId: number;
  declare packageId: number | null;
  declare leadId: number | null;
  declare transactionType: 'PACKAGE_PURCHASE' | 'LEAD_CONSUMED' | 'LEAD_REFUND' | 'ADMIN_ADJUSTMENT';
  declare leadAmount: number;
  declare balanceBefore: number;
  declare balanceAfter: number;
  declare description: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

LeadTransaction.init(
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
      allowNull: true,
    },
    leadId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    transactionType: {
      type: DataTypes.ENUM('PACKAGE_PURCHASE', 'LEAD_CONSUMED', 'LEAD_REFUND', 'ADMIN_ADJUSTMENT'),
      allowNull: false,
    },
    leadAmount: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    balanceBefore: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    balanceAfter: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'lead_transactions',
    timestamps: true,
  }
);
