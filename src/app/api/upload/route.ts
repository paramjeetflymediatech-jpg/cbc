import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { Hospital } from '@/models';
import { connectDB } from '@/lib/db';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(req: Request) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const category = (formData.get('category') as string) || 'gallery';
    const customHospitalName = formData.get('hospitalName') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'No image file provided' }, { status: 400 });
    }

    // Determine hospital folder name
    let hospitalFolder = 'general-hospitals';

    if (authUser.role === 'HOSPITAL' && authUser.hospitalId) {
      await connectDB();
      const hospital = await Hospital.findByPk(authUser.hospitalId);
      if (hospital) {
        hospitalFolder = hospital.slug || hospital.name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
      }
    } else if (customHospitalName) {
      hospitalFolder = customHospitalName.toLowerCase().trim().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
    }

    // Target upload directory: public/uploads/hospitals/[hospitalFolder]
    const targetDir = path.join(process.cwd(), 'public', 'uploads', 'hospitals', hospitalFolder);
    await mkdir(targetDir, { recursive: true });

    // Sanitize filename & create unique timestamped name
    const originalExt = path.extname(file.name) || '.jpg';
    const cleanExt = originalExt.toLowerCase();
    const uniqueFileName = `${Date.now()}-${category}${cleanExt}`;
    const filePath = path.join(targetDir, uniqueFileName);

    // Buffer and write file to local public folder
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Also sync to standalone public directory if running in Next standalone mode
    try {
      const standaloneTargetDir = path.join(process.cwd(), '.next', 'standalone', 'public', 'uploads', 'hospitals', hospitalFolder);
      await mkdir(standaloneTargetDir, { recursive: true });
      await writeFile(path.join(standaloneTargetDir, uniqueFileName), buffer);
    } catch {}

    // Generate public relative URL
    const publicUrl = `/uploads/hospitals/${hospitalFolder}/${uniqueFileName}`;

    return NextResponse.json({
      message: 'File uploaded successfully',
      url: publicUrl,
      fileName: uniqueFileName,
      hospitalFolder,
    });
  } catch (error) {
    console.error('File upload error:', error);
    return NextResponse.json({ error: 'Failed to upload image file' }, { status: 500 });
  }
}
