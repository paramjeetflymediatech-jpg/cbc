import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '@/lib/db';

export interface BlogPostAttributes {
  id: number;
  title: string;
  slug: string;
  excerpt?: string | null;
  content: string;
  image?: string | null;
  category?: string | null;
  author?: string | null;
  readTime?: string | null;
  tags?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  seoKeywords?: string | null;
  canonicalUrl?: string | null;
  ogImage?: string | null;
  ogTitle?: string | null;
  ogDescription?: string | null;
  robotsIndex?: string | null;
  schemaMarkup?: string | null;
  status: 'DRAFT' | 'PUBLISHED';
  publishedAt?: Date | null;
  views: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export type BlogPostCreationAttributes = Optional<BlogPostAttributes, 'id' | 'status' | 'views'>;

export class BlogPost extends Model<BlogPostAttributes, BlogPostCreationAttributes> implements BlogPostAttributes {
  declare id: number;
  declare title: string;
  declare slug: string;
  declare excerpt: string | null;
  declare content: string;
  declare image: string | null;
  declare category: string | null;
  declare author: string | null;
  declare readTime: string | null;
  declare tags: string | null;
  declare seoTitle: string | null;
  declare seoDescription: string | null;
  declare seoKeywords: string | null;
  declare canonicalUrl: string | null;
  declare ogImage: string | null;
  declare ogTitle: string | null;
  declare ogDescription: string | null;
  declare robotsIndex: string | null;
  declare schemaMarkup: string | null;
  declare status: 'DRAFT' | 'PUBLISHED';
  declare publishedAt: Date | null;
  declare views: number;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

BlogPost.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    slug: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
    excerpt: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    content: {
      type: DataTypes.TEXT('long'),
      allowNull: false,
    },
    image: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    category: {
      type: DataTypes.STRING(100),
      allowNull: true,
      defaultValue: 'General Health',
    },
    author: {
      type: DataTypes.STRING(100),
      allowNull: true,
      defaultValue: 'Clinic By Choice Editorial Team',
    },
    readTime: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: '5 min read',
    },
    tags: {
      type: DataTypes.STRING(255),
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
    seoKeywords: {
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
    status: {
      type: DataTypes.ENUM('DRAFT', 'PUBLISHED'),
      allowNull: false,
      defaultValue: 'PUBLISHED',
    },
    publishedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    views: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    sequelize,
    tableName: 'blog_posts',
    timestamps: true,
  }
);
