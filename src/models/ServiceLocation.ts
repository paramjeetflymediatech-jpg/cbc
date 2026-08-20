import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '@/lib/db';

export interface ServiceLocationAttributes {
  id: number;
  serviceId: number;
  serviceSlug?: string;
  serviceTitle?: string;
  cityName: string;
  citySlug: string;
  stateName?: string;
  shortDescription?: string;
  description?: string;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  faqs?: Array<{ question: string; answer: string }>;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ServiceLocationCreationAttributes
  extends Optional<ServiceLocationAttributes, 'id' | 'status' | 'createdAt' | 'updatedAt'> {}

export class ServiceLocation
  extends Model<ServiceLocationAttributes, ServiceLocationCreationAttributes>
  implements ServiceLocationAttributes
{
  declare id: number;
  declare serviceId: number;
  declare serviceSlug?: string;
  declare serviceTitle?: string;
  declare cityName: string;
  declare citySlug: string;
  declare stateName?: string;
  declare shortDescription?: string;
  declare description?: string;
  declare seoTitle?: string;
  declare seoDescription?: string;
  declare seoKeywords?: string;
  declare faqs?: Array<{ question: string; answer: string }>;
  declare status: 'ACTIVE' | 'INACTIVE';
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

ServiceLocation.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    serviceId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'services',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    serviceSlug: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    serviceTitle: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    cityName: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    citySlug: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    stateName: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    shortDescription: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    description: {
      type: DataTypes.TEXT('long'),
      allowNull: true,
    },
    seoTitle: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    seoDescription: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    seoKeywords: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    faqs: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
    },
    status: {
      type: DataTypes.ENUM('ACTIVE', 'INACTIVE'),
      defaultValue: 'ACTIVE',
    },
  },
  {
    sequelize,
    tableName: 'service_locations',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['serviceId', 'citySlug'],
        name: 'idx_service_city_unique',
      },
    ],
  }
);
