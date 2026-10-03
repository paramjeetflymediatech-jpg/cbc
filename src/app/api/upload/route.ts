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
    const files = formData.getAll('files') as File[];
    const singleFiles = formData.getAll('file') as File[];
    const combinedFiles = files.length > 0 ? files : singleFiles;

    if (!combinedFiles || combinedFiles.length === 0 || !combinedFiles[0]) {
      return NextResponse.json({ error: 'No image file provided' }, { status: 400 });
    }

    const category = (formData.get('category') as string) || 'gallery';
    const customHospitalName = formData.get('hospitalName') as string | null;

    // Determine target folder name and path
    let folderPath = 'hospitals/general-hospitals';

    if (category.startsWith('blogs')) {
      folderPath = 'blogs';
    } else if (category === 'avatar' || category === 'profile' || authUser.role === 'PATIENT') {
      folderPath = 'avatars';
    } else if (authUser.role === 'HOSPITAL' && authUser.hospitalId) {
      await connectDB();
      const hospital = await Hospital.findByPk(authUser.hospitalId);
      if (hospital) {
        const hospitalFolder = hospital.slug || hospital.name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
        folderPath = `hospitals/${hospitalFolder}`;
      }
    } else if (customHospitalName) {
      const hospitalFolder = customHospitalName.toLowerCase().trim().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
      folderPath = `hospitals/${hospitalFolder}`;
    }

    // Target upload directory: public/uploads/[folderPath]
    const targetDir = path.join(process.cwd(), 'public', 'uploads', folderPath);
    await mkdir(targetDir, { recursive: true });
    const standaloneTargetDir = path.join(process.cwd(), '.next', 'standalone', 'public', 'uploads', folderPath);

    const uploadedItems: { url: string; alt: string; fileName: string }[] = [];

    for (let i = 0; i < combinedFiles.length; i++) {
      const file = combinedFiles[i];
      if (!file || typeof file.arrayBuffer !== 'function') continue;

      const originalName = file.name || `image-${i + 1}`;
      const originalExt = path.extname(originalName) || '.jpg';
      const cleanExt = originalExt.toLowerCase();
      const baseNameWithoutExt = path.basename(originalName, originalExt).replace(/[-_]+/g, ' ').trim();
      const uniqueFileName = `${Date.now()}-${i}-${category}${cleanExt}`;
      const filePath = path.join(targetDir, uniqueFileName);

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      await writeFile(filePath, buffer);

      try {
        await mkdir(standaloneTargetDir, { recursive: true });
        await writeFile(path.join(standaloneTargetDir, uniqueFileName), buffer);
      } catch {}

      const publicUrl = `/uploads/${folderPath}/${uniqueFileName}`;
      uploadedItems.push({
        url: publicUrl,
        alt: baseNameWithoutExt || 'Hospital Facility Photo',
        fileName: uniqueFileName,
      });
    }

    if (uploadedItems.length === 0) {
      return NextResponse.json({ error: 'Failed to process image files' }, { status: 400 });
    }

    return NextResponse.json({
      message: `${uploadedItems.length} file(s) uploaded successfully`,
      url: uploadedItems[0].url,
      urls: uploadedItems.map((item) => item.url),
      items: uploadedItems,
      folderPath,
    });
  } catch (error) {
    console.error('File upload error:', error);
    return NextResponse.json({ error: 'Failed to upload image file' }, { status: 500 });
  }
}
