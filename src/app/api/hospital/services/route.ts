import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { HospitalService, Service } from '@/models';

export async function GET() {
  try {
    const authUser = await getAuthUser();
    if (!authUser || authUser.role !== 'HOSPITAL' || !authUser.hospitalId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const allPlatformServices = await Service.findAll({
      where: { status: 'ACTIVE' },
      include: [
        { model: Service, as: 'parent', required: false, attributes: ['id', 'name', 'slug'] },
        { model: Service, as: 'subServices', required: false, attributes: ['id', 'name', 'slug'] },
      ],
      order: [['name', 'ASC']],
    });
    const hospitalServices = await HospitalService.findAll({
      where: { hospitalId: authUser.hospitalId },
      include: [{ model: Service, as: 'service', include: [{ model: Service, as: 'parent', required: false }] }],
    });

    return NextResponse.json({ allPlatformServices, hospitalServices });
  } catch (error) {
    console.error('Hospital services GET error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const authUser = await getAuthUser();
    if (!authUser || authUser.role !== 'HOSPITAL' || !authUser.hospitalId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { hospitalServiceId, id: recordId, serviceId, startingPrice, description, treatmentDetails, subServices, status } = await req.json();

    if (!serviceId) {
      return NextResponse.json({ error: 'Service ID is required' }, { status: 400 });
    }

    let hs;
    let created = false;

    const targetRecordId = hospitalServiceId || recordId;
    if (targetRecordId) {
      hs = await HospitalService.findOne({
        where: { id: Number(targetRecordId), hospitalId: Number(authUser.hospitalId) },
      });
      if (hs) {
        await hs.update({
          serviceId: Number(serviceId),
          startingPrice: startingPrice !== undefined && startingPrice !== '' ? Number(startingPrice) : null,
          description: description !== undefined ? description : hs.description,
          treatmentDetails: treatmentDetails !== undefined ? treatmentDetails : hs.treatmentDetails,
          subServices: subServices !== undefined ? subServices : hs.subServices,
          status: status || hs.status,
        });
      }
    }

    if (!hs) {
      const result = await HospitalService.findOrCreate({
        where: { hospitalId: Number(authUser.hospitalId), serviceId: Number(serviceId) },
        defaults: {
          hospitalId: Number(authUser.hospitalId),
          serviceId: Number(serviceId),
          startingPrice: startingPrice ? Number(startingPrice) : null,
          description: description || null,
          treatmentDetails: treatmentDetails || null,
          subServices: subServices || null,
          status: status || 'ACTIVE',
        },
      });
      hs = result[0];
      created = result[1];
      if (!created) {
        await hs.update({
          startingPrice: startingPrice !== undefined ? Number(startingPrice) : hs.startingPrice,
          description: description !== undefined ? description : hs.description,
          treatmentDetails: treatmentDetails !== undefined ? treatmentDetails : hs.treatmentDetails,
          subServices: subServices !== undefined ? subServices : hs.subServices,
          status: status || hs.status,
        });
      }
    }

    return NextResponse.json({ message: 'Service updated', hospitalService: hs });
  } catch (error) {
    console.error('Hospital service update error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
