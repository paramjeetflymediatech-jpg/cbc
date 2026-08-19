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
      const { initAssociations, BlogPost, Testimonial, Setting, SeoMetadata } = await import('../models');
      initAssociations();
      await instance.authenticate();
      await instance.sync();
      await BlogPost.sync({ alter: true });
      await Testimonial.sync();
      await Setting.sync({ alter: true });
      await SeoMetadata.sync({ alter: true });

      // Ensure new hospital & service columns exist
      try {
        const queryInterface = instance.getQueryInterface();
        
        try {
          await instance.query("ALTER TABLE users MODIFY COLUMN role ENUM('SUPER_ADMIN', 'ADMIN', 'HOSPITAL', 'PATIENT') NOT NULL DEFAULT 'PATIENT';");
        } catch (uErr) {
          // Already modified or error
        }

        const table: any = await queryInterface.describeTable('hospitals');

        if (!table.isNabhAccredited) {
          await instance.query('ALTER TABLE hospitals ADD COLUMN isNabhAccredited TINYINT(1) NOT NULL DEFAULT 1;');
        }
        if (!table.isVerifiedPartner) {
          await instance.query('ALTER TABLE hospitals ADD COLUMN isVerifiedPartner TINYINT(1) NOT NULL DEFAULT 1;');
        }
        if (!table.googleRating) {
          await instance.query('ALTER TABLE hospitals ADD COLUMN googleRating FLOAT NOT NULL DEFAULT 4.8;');
        }
        if (!table.googlePlaceId) {
          await instance.query('ALTER TABLE hospitals ADD COLUMN googlePlaceId VARCHAR(255) NULL;');
        }
        if (!table.googleReviewsCount) {
          await instance.query('ALTER TABLE hospitals ADD COLUMN googleReviewsCount INT NULL DEFAULT 0;');
        }
        if (!table.googleReviews) {
          await instance.query('ALTER TABLE hospitals ADD COLUMN googleReviews JSON NULL;');
        }

        const servicesTable: any = await queryInterface.describeTable('services');
        if (!servicesTable.parentId) {
          await instance.query('ALTER TABLE services ADD COLUMN parentId INT NULL REFERENCES services(id) ON DELETE SET NULL;');
        }
        if (!servicesTable.faqs) {
          await instance.query('ALTER TABLE services ADD COLUMN faqs JSON NULL;');
        }

        const hsTable: any = await queryInterface.describeTable('hospital_services');
        if (!hsTable.subServices) {
          await instance.query('ALTER TABLE hospital_services ADD COLUMN subServices TEXT NULL;');
        }

        const leadsTable: any = await queryInterface.describeTable('leads');
        if (!leadsTable.userId) {
          await instance.query('ALTER TABLE leads ADD COLUMN userId INT NULL REFERENCES users(id) ON DELETE SET NULL;');
        }
      } catch (colErr) {
        // Table schema up to date or column already exists
      }

      return instance;
    } catch (error) {
      console.warn('MySQL DB Connection notice:', (error as Error)?.message || error);
      return null;
    }
  })();

  return cached.initPromise;
}
