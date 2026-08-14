import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '@/lib/db';

export interface TestimonialAttributes {
  id: number;
  doctorName: string;
  hospitalInfo: string;
  quote: string;
  image?: string | null;
  rating?: number;
  status: 'ACTIVE' | 'INACTIVE';
  orderIndex?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export type TestimonialCreationAttributes = Optional<
  TestimonialAttributes,
  'id' | 'image' | 'rating' | 'status' | 'orderIndex'
>;

export class Testimonial extends Model<TestimonialAttributes, TestimonialCreationAttributes> implements TestimonialAttributes {
  declare id: number;
  declare doctorName: string;
  declare hospitalInfo: string;
  declare quote: string;
  declare image: string | null;
  declare rating: number;
  declare status: 'ACTIVE' | 'INACTIVE';
  declare orderIndex: number;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Testimonial.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    doctorName: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    hospitalInfo: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    quote: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    image: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    rating: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 5.0,
    },
    status: {
      type: DataTypes.ENUM('ACTIVE', 'INACTIVE'),
      allowNull: false,
      defaultValue: 'ACTIVE',
    },
    orderIndex: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    sequelize,
    tableName: 'testimonials',
    timestamps: true,
  }
);
