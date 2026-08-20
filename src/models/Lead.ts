import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '@/lib/db';

export interface ILeadNote {
  content: string;
  author: string;
  createdAt: string;
}

export interface LeadAttributes {
  id: number;
  userId?: number | null;
  patientName: string;
  phone: string;
  email: string;
  city: string;
  serviceId: number;
  hospitalId: number;
  message?: string | null;
  preferredContactTime?: string | null;
  status: 'NEW' | 'CONTACTED' | 'IN_PROGRESS' | 'CONVERTED' | 'LOST' | 'CANCELLED' | 'UNASSIGNED' | 'EXPIRED';
  notes?: ILeadNote[] | null;
  deletedByUser?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export type LeadCreationAttributes = Optional<LeadAttributes, 'id' | 'status' | 'notes' | 'userId'>;

export class Lead extends Model<LeadAttributes, LeadCreationAttributes> implements LeadAttributes {
  declare id: number;
  declare userId: number | null;
  declare patientName: string;
  declare phone: string;
  declare email: string;
  declare city: string;
  declare serviceId: number;
  declare hospitalId: number;
  declare message: string | null;
  declare preferredContactTime: string | null;
  declare status: 'NEW' | 'CONTACTED' | 'IN_PROGRESS' | 'CONVERTED' | 'LOST' | 'CANCELLED' | 'UNASSIGNED' | 'EXPIRED';
  declare notes: ILeadNote[] | null;
  declare deletedByUser: boolean;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Lead.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'SET NULL',
    },
    patientName: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
    phone: {
      type: DataTypes.STRING(30),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
    city: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    serviceId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    hospitalId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    preferredContactTime: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('NEW', 'CONTACTED', 'IN_PROGRESS', 'CONVERTED', 'LOST', 'CANCELLED', 'UNASSIGNED', 'EXPIRED'),
      allowNull: false,
      defaultValue: 'NEW',
    },
    notes: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    deletedByUser: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    sequelize,
    tableName: 'leads',
    timestamps: true,
  }
);
