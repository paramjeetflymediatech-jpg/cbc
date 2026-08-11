import { Sequelize } from 'sequelize';

interface SequelizeCache {
  sequelize: Sequelize | null;
  initPromise: Promise<Sequelize | null> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var sequelizeCache: SequelizeCache | undefined;
}

const cached: SequelizeCache = global.sequelizeCache || { sequelize: null, initPromise: null };
if (!global.sequelizeCache) {
  global.sequelizeCache = cached;
}

export function getSequelize(): Sequelize {
  if (cached.sequelize) {
    return cached.sequelize;
  }

  const MYSQL_DATABASE = process.env.MYSQL_DATABASE || 'clinicbychoice';
  const MYSQL_USER = process.env.MYSQL_USER || 'root';
  const MYSQL_PASSWORD = process.env.MYSQL_PASSWORD || '';
  const MYSQL_HOST = process.env.MYSQL_HOST || '127.0.0.1';
  const MYSQL_PORT = parseInt(process.env.MYSQL_PORT || '3306', 10);

  const sequelize = new Sequelize(MYSQL_DATABASE, MYSQL_USER, MYSQL_PASSWORD, {
    host: MYSQL_HOST,
    port: MYSQL_PORT,
    dialect: 'mysql',
    logging: false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    dialectOptions: {
      decimalNumbers: true,
    },
  });

  cached.sequelize = sequelize;
  return sequelize;
}

export const sequelize = getSequelize();

export async function connectDB(): Promise<Sequelize | null> {
  const instance = getSequelize();

  if (cached.initPromise) {
    return cached.initPromise;
  }

  cached.initPromise = (async () => {
    try {
      const { initAssociations } = await import('../models');
      initAssociations();
      await instance.authenticate();
      await instance.sync();
      return instance;
    } catch (error) {
      console.warn('MySQL DB Connection notice:', (error as Error)?.message || error);
      return null;
    }
  })();

  return cached.initPromise;
}
