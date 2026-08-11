import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '@/lib/db';

export interface NotificationAttributes {
  id: number;
  recipientType: 'HOSPITAL' | 'ADMIN';
  recipientId?: number | null;
  title: string;
  message: string;
  type: 'NEW_LEAD' | 'PACKAGE_PURCHASED' | 'LOW_BALANCE' | 'PACKAGE_EXHAUSTED' | 'PACKAGE_EXPIRED' | 'NEW_REGISTRATION' | 'SYSTEM';
  isRead: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export type NotificationCreationAttributes = Optional<NotificationAttributes, 'id' | 'isRead' | 'recipientId'>;

export class Notification
  extends Model<NotificationAttributes, NotificationCreationAttributes>
  implements NotificationAttributes
{
  declare id: number;
  declare recipientType: 'HOSPITAL' | 'ADMIN';
  declare recipientId: number | null;
  declare title: string;
  declare message: string;
  declare type: 'NEW_LEAD' | 'PACKAGE_PURCHASED' | 'LOW_BALANCE' | 'PACKAGE_EXHAUSTED' | 'PACKAGE_EXPIRED' | 'NEW_REGISTRATION' | 'SYSTEM';
  declare isRead: boolean;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Notification.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    recipientType: {
      type: DataTypes.ENUM('HOSPITAL', 'ADMIN'),
      allowNull: false,
    },
    recipientId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM('NEW_LEAD', 'PACKAGE_PURCHASED', 'LOW_BALANCE', 'PACKAGE_EXHAUSTED', 'PACKAGE_EXPIRED', 'NEW_REGISTRATION', 'SYSTEM'),
      allowNull: false,
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    sequelize,
    tableName: 'notifications',
    timestamps: true,
  }
);
