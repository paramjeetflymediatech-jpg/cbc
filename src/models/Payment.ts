import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '@/lib/db';

export interface PaymentAttributes {
  id: number;
  hospitalId: number;
  packageId: number;
  amount: number;
  currency: string;
  gateway: 'PHONEPE' | 'RAZORPAY' | 'MANUAL';
  merchantTransactionId: string;
  providerReferenceId?: string | null;
  checksum?: string | null;
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED';
  rawResponse?: object | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export type PaymentCreationAttributes = Optional<
  PaymentAttributes,
  'id' | 'currency' | 'gateway' | 'status' | 'providerReferenceId' | 'checksum' | 'rawResponse'
>;

export class Payment extends Model<PaymentAttributes, PaymentCreationAttributes> implements PaymentAttributes {
  declare id: number;
  declare hospitalId: number;
  declare packageId: number;
  declare amount: number;
  declare currency: string;
  declare gateway: 'PHONEPE' | 'RAZORPAY' | 'MANUAL';
  declare merchantTransactionId: string;
  declare providerReferenceId: string | null;
  declare checksum: string | null;
  declare status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED';
  declare rawResponse: object | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Payment.init(
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
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    currency: {
      type: DataTypes.STRING(10),
      allowNull: false,
      defaultValue: 'INR',
    },
    gateway: {
      type: DataTypes.ENUM('PHONEPE', 'RAZORPAY', 'MANUAL'),
      allowNull: false,
      defaultValue: 'PHONEPE',
    },
    merchantTransactionId: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    providerReferenceId: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    checksum: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('PENDING', 'SUCCESS', 'FAILED', 'REFUNDED'),
      allowNull: false,
      defaultValue: 'PENDING',
    },
    rawResponse: {
      type: DataTypes.JSON,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'payments',
    timestamps: true,
  }
);
