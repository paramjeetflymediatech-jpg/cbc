import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '@/lib/db';

export interface IDoctor {
  name: string;
  qualification?: string;
  specialty?: string;
  experience?: string;
  image?: string;
}

export interface IFAQ {
  question: string;
  answer: string;
}

export interface HospitalAttributes {
  id: number;
  name: string;
  slug: string;
  email: string;
  phone: string;
  website?: string | null;
  address: string;
  city: string;
  district?: string | null;
  state?: string | null;
  country?: string | null;
  description: string;
  logo?: string | null;
  coverImage?: string | null;
  gallery?: string[] | null;
  contactPersonName?: string | null;
  contactPersonEmail?: string | null;
  contactPersonPhone?: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
  accountStatus: 'ACTIVE' | 'INACTIVE';
  rejectionReason?: string | null;
  leadsRemaining: number;
  totalLeadsPurchased: number;
  totalLeadsUsed: number;
  doctors?: IDoctor[] | null;
  facilities?: string[] | null;
  faqs?: IFAQ[] | null;
  rating: number;
  isFeatured: boolean;
  isNabhAccredited: boolean;
  isVerifiedPartner: boolean;
  googleRating: number;
  googlePlaceId?: string | null;
  googleReviewsCount?: number | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export type HospitalCreationAttributes = Optional<
  HospitalAttributes,
  | 'id'
  | 'status'
  | 'accountStatus'
  | 'leadsRemaining'
  | 'totalLeadsPurchased'
  | 'totalLeadsUsed'
  | 'rating'
  | 'isFeatured'
  | 'isNabhAccredited'
  | 'isVerifiedPartner'
  | 'googleRating'
  | 'googlePlaceId'
  | 'googleReviewsCount'
  | 'gallery'
  | 'doctors'
  | 'facilities'
  | 'faqs'
>;

export class Hospital extends Model<HospitalAttributes, HospitalCreationAttributes> implements HospitalAttributes {
  declare id: number;
  declare name: string;
  declare slug: string;
  declare email: string;
  declare phone: string;
  declare website: string | null;
  declare address: string;
  declare city: string;
  declare district: string | null;
  declare state: string | null;
  declare country: string | null;
  declare description: string;
  declare logo: string | null;
  declare coverImage: string | null;
  declare gallery: string[] | null;
  declare contactPersonName: string | null;
  declare contactPersonEmail: string | null;
  declare contactPersonPhone: string | null;
  declare status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
  declare accountStatus: 'ACTIVE' | 'INACTIVE';
  declare rejectionReason: string | null;
  declare leadsRemaining: number;
  declare totalLeadsPurchased: number;
  declare totalLeadsUsed: number;
  declare doctors: IDoctor[] | null;
  declare facilities: string[] | null;
  declare faqs: IFAQ[] | null;
  declare rating: number;
  declare isFeatured: boolean;
  declare isNabhAccredited: boolean;
  declare isVerifiedPartner: boolean;
  declare googleRating: number;
  declare googlePlaceId: string | null;
  declare googleReviewsCount: number | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Hospital.init(
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
    email: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
    phone: {
      type: DataTypes.STRING(30),
      allowNull: false,
    },
    website: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    city: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    district: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    state: {
      type: DataTypes.STRING(100),
      allowNull: true,
      defaultValue: 'India',
    },
    country: {
      type: DataTypes.STRING(100),
      allowNull: true,
      defaultValue: 'India',
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    logo: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    coverImage: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    gallery: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    contactPersonName: {
      type: DataTypes.STRING(150),
      allowNull: true,
    },
    contactPersonEmail: {
      type: DataTypes.STRING(150),
      allowNull: true,
    },
    contactPersonPhone: {
      type: DataTypes.STRING(30),
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED'),
      allowNull: false,
      defaultValue: 'PENDING',
    },
    accountStatus: {
      type: DataTypes.ENUM('ACTIVE', 'INACTIVE'),
      allowNull: false,
      defaultValue: 'ACTIVE',
    },
    rejectionReason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    leadsRemaining: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    totalLeadsPurchased: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    totalLeadsUsed: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    doctors: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    facilities: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    faqs: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    rating: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 4.8,
    },
    isFeatured: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    isNabhAccredited: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    isVerifiedPartner: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    googleRating: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 4.8,
    },
    googlePlaceId: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    googleReviewsCount: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },
  },
  {
    sequelize,
    tableName: 'hospitals',
    timestamps: true,
  }
);
