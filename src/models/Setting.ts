import { DataTypes, Model } from 'sequelize';
import { sequelize } from '@/lib/db';

export interface SettingAttributes {
  key: string;
  value: string;
}

export class Setting extends Model<SettingAttributes> implements SettingAttributes {
  declare key: string;
  declare value: string;
}

Setting.init(
  {
    key: {
      type: DataTypes.STRING(255),
      primaryKey: true,
      allowNull: false,
    },
    value: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'settings',
    timestamps: true,
  }
);
