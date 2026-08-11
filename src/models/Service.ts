import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '@/lib/db';

export interface ServiceAttributes {
  id: number;
  name: string;
  slug: string;
  category?: string | null;
  shortDescription?: string | null;
  description?: string | null;
  icon?: string | null;
  image?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt?: Date;
  updatedAt?: Date;
}

export type ServiceCreationAttributes = Optional<ServiceAttributes, 'id' | 'status'>;

export class Service extends Model<ServiceAttributes, ServiceCreationAttributes> implements ServiceAttributes {
  declare id: number;
  declare name: string;
  declare slug: string;
  declare category: string | null;
  declare shortDescription: string | null;
  declare description: string | null;
  declare icon: string | null;
  declare image: string | null;
  declare seoTitle: string | null;
  declare seoDescription: string | null;
  declare status: 'ACTIVE' | 'INACTIVE';
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Service.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    slug: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
    category: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    shortDescription: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    icon: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    image: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    seoTitle: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    seoDescription: {
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
    tableName: 'services',
    timestamps: true,
  }
);
