import dotenv from 'dotenv';
import path from 'path';
import bcrypt from 'bcryptjs';

// Load environment variables prior to importing DB & models
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

function parseArgs() {
  const args = process.argv.slice(2);
  const options: Record<string, string> = {};

  args.forEach((arg) => {
    if (arg.startsWith('--')) {
      const [key, ...val] = arg.slice(2).split('=');
      options[key] = val.join('=') || 'true';
    }
  });

  return options;
}

export async function createSuperAdmin(customEmail?: string, customPassword?: string, customName?: string, customPhone?: string) {
  const { connectDB } = await import('../lib/db');
  const { User } = await import('../models');

  await connectDB();
  await User.sync();

  const email = (customEmail || process.env.SUPER_ADMIN_DEFAULT_EMAIL || 'admin@clinicbychoice.com').trim().toLowerCase();
  const password = customPassword || process.env.SUPER_ADMIN_DEFAULT_PASS || 'Admin123!';
  const name = customName || 'Clinic By Choice Super Admin';
  const phone = customPhone || '+91 9876543210';

  const passwordHash = await bcrypt.hash(password, 10);

  const [user, created] = await User.findOrCreate({
    where: { email },
    defaults: {
      name,
      email,
      passwordHash,
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      phone,
    },
  });

  if (!created) {
    // Update existing user to SUPER_ADMIN & update credentials if provided
    await user.update({
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      passwordHash,
      ...(customName ? { name } : {}),
      ...(customPhone ? { phone } : {}),
    });
    console.log(` Updated existing user [${email}] to SUPER_ADMIN!`);
  } else {
    console.log(` Created new SUPER_ADMIN user [${email}]!`);
  }

  console.log('----------------------------------------------------');
  console.log(' SUPER ADMIN CREDENTIALS');
  console.log('----------------------------------------------------');
  console.log(` • Name:     ${name}`);
  console.log(` • Email:    ${email}`);
  console.log(` • Password: ${password}`);
  console.log(` • Role:     SUPER_ADMIN`);
  console.log(` • Status:   ACTIVE`);
  console.log('----------------------------------------------------');

  return { email, password, role: 'SUPER_ADMIN' };
}

async function main() {
  try {
    const options = parseArgs();

    const email = options.email || options.e;
    const password = options.password || options.p;
    const name = options.name || options.n;
    const phone = options.phone;

    console.log('----------------------------------------------------');
    console.log(' Clinic By Choice - Create Super Admin Script');
    console.log('----------------------------------------------------');
    console.log('• MYSQL_HOST:', process.env.MYSQL_HOST || '127.0.0.1');
    console.log('• MYSQL_DATABASE:', process.env.MYSQL_DATABASE || 'clinicbychoice');
    console.log('----------------------------------------------------');

    await createSuperAdmin(email, password, name, phone);

    process.exit(0);
  } catch (error) {
    console.error(' Failed to create Super Admin:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
