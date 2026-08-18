import { DataTypes, Model } from 'sequelize';
import { sequelize } from '@/lib/db';

export interface SeoMetadataAttributes {
  id?: number;
  pageName: string;
  path: string;
  title: string;
  description: string;
  keywords?: string | null;
  canonicalUrl?: string | null;
  ogImage?: string | null;
  ogTitle?: string | null;
  ogDescription?: string | null;
  robotsIndex?: string | null; // e.g. 'index, follow' or 'noindex, nofollow'
  schemaMarkup?: string | null; // JSON-LD schema
  createdAt?: Date;
  updatedAt?: Date;
}

export class SeoMetadata extends Model<SeoMetadataAttributes> implements SeoMetadataAttributes {
  declare id: number;
  declare pageName: string;
  declare path: string;
  declare title: string;
  declare description: string;
  declare keywords: string | null;
  declare canonicalUrl: string | null;
  declare ogImage: string | null;
  declare ogTitle: string | null;
  declare ogDescription: string | null;
  declare robotsIndex: string | null;
  declare schemaMarkup: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

SeoMetadata.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    pageName: {
      type: DataTypes.STRING(255),
      allowNull: false,
      defaultValue: 'Unnamed Page',
    },
    path: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    keywords: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    canonicalUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    ogImage: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    ogTitle: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    ogDescription: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    robotsIndex: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: 'index, follow',
    },
    schemaMarkup: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'seo_metadata',
    timestamps: true,
  }
);
