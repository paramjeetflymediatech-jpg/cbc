import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { HospitalService, Service, Hospital, initAssociations } from '@/models';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthUser();
    if (!authUser || authUser.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const hospitalId = Number(id);
    if (!hospitalId) {
      return NextResponse.json({ error: 'Invalid hospital ID' }, { status: 400 });
    }

    await connectDB();
    initAssociations();

    const hospital = await Hospital.findByPk(hospitalId);
    if (!hospital) {
      return NextResponse.json({ error: 'Hospital not found' }, { status: 404 });
    }

    const allPlatformServices = await Service.findAll({
      where: { status: 'ACTIVE' },
      order: [['name', 'ASC']],
    });

    const hospitalServices = await HospitalService.findAll({
      where: { hospitalId },
      include: [{ model: Service, as: 'service' }],
      order: [['createdAt', 'DESC']],
    });

    return NextResponse.json({ allPlatformServices, hospitalServices });
  } catch (error) {
    console.error('Super Admin GET hospital services error:', error);
    return NextResponse.json({ error: 'Server error fetching hospital services' }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthUser();
    if (!authUser || authUser.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const hospitalId = Number(id);
    if (!hospitalId) {
      return NextResponse.json({ error: 'Invalid hospital ID' }, { status: 400 });
    }

    await connectDB();
    initAssociations();

    const hospital = await Hospital.findByPk(hospitalId);
    if (!hospital) {
      return NextResponse.json({ error: 'Hospital not found' }, { status: 404 });
    }

    const body = await req.json();
    const { serviceId, startingPrice, description, treatmentDetails, subServices, status } = body;

    if (!serviceId) {
      return NextResponse.json({ error: 'Service ID is required' }, { status: 400 });
    }

    const [hs, created] = await HospitalService.findOrCreate({
      where: { hospitalId, serviceId: Number(serviceId) },
      defaults: {
        hospitalId,
        serviceId: Number(serviceId),
        startingPrice: startingPrice !== undefined && startingPrice !== '' ? Number(startingPrice) : null,
        description: description || null,
        treatmentDetails: treatmentDetails || null,
        subServices: subServices || null,
        status: status || 'ACTIVE',
      },
    });

    if (!created) {
      await hs.update({
        startingPrice: startingPrice !== undefined && startingPrice !== '' ? Number(startingPrice) : hs.startingPrice,
        description: description !== undefined ? description : hs.description,
        treatmentDetails: treatmentDetails !== undefined ? treatmentDetails : hs.treatmentDetails,
        subServices: subServices !== undefined ? subServices : hs.subServices,
        status: status || hs.status,
      });
    }

    // Refetch updated list
    const updatedServices = await HospitalService.findAll({
      where: { hospitalId },
      include: [{ model: Service, as: 'service' }],
      order: [['createdAt', 'DESC']],
    });

    return NextResponse.json({
      message: created ? 'Service linked successfully' : 'Hospital service updated successfully',
      hospitalService: hs,
      hospitalServices: updatedServices,
    });
  } catch (error) {
    console.error('Super Admin POST hospital service error:', error);
    return NextResponse.json({ error: 'Server error updating hospital service' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthUser();
    if (!authUser || authUser.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const hospitalId = Number(id);
    if (!hospitalId) {
      return NextResponse.json({ error: 'Invalid hospital ID' }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const serviceId = searchParams.get('serviceId');
    const hospitalServiceId = searchParams.get('hospitalServiceId');

    await connectDB();
    initAssociations();

    if (hospitalServiceId) {
      await HospitalService.destroy({
        where: { id: Number(hospitalServiceId), hospitalId },
      });
    } else if (serviceId) {
      await HospitalService.destroy({
        where: { serviceId: Number(serviceId), hospitalId },
      });
    } else {
      return NextResponse.json({ error: 'serviceId or hospitalServiceId is required' }, { status: 400 });
    }

    const updatedServices = await HospitalService.findAll({
      where: { hospitalId },
      include: [{ model: Service, as: 'service' }],
      order: [['createdAt', 'DESC']],
    });

    return NextResponse.json({
      message: 'Hospital service unlinked successfully',
      hospitalServices: updatedServices,
    });
  } catch (error) {
    console.error('Super Admin DELETE hospital service error:', error);
    return NextResponse.json({ error: 'Server error removing hospital service' }, { status: 500 });
  }
}
