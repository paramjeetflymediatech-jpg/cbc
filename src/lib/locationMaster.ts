import { State, District, City } from '@/models';
import { Op } from 'sequelize';
import { cleanLocationName, isIndiaLocation } from './locationUtils';

export { cleanLocationName, isIndiaLocation };

/**
 * Ensures State, District, and City exist in location master tables.
 * Automatically cleans names and creates missing records linked together in DB.
 */
export async function ensureLocationMasterExists({
  state,
  district,
  city,
}: {
  state?: string | null;
  district?: string | null;
  city?: string | null;
}) {
  try {
    const rawState = state?.trim();
    const rawCity = city?.trim();
    const rawDistrict = district?.trim();

    if (!rawState || !rawCity) return;

    const stateName = cleanLocationName(rawState) || rawState;
    const cityName = cleanLocationName(rawCity) || rawCity;
    const districtName = cleanLocationName(rawDistrict) || rawDistrict;

    // 1. Ensure State exists in DB (Case-insensitive check)
    let stateRecord = await State.findOne({
      where: {
        name: { [Op.like]: stateName },
      },
    });

    if (!stateRecord) {
      [stateRecord] = await State.findOrCreate({
        where: { name: stateName },
        defaults: {
          name: stateName,
          status: 'ACTIVE',
        },
      });
    }

    // 2. Ensure District exists in DB if provided
    let districtRecord = null;
    if (districtName) {
      districtRecord = await District.findOne({
        where: {
          stateId: stateRecord.id,
          name: { [Op.like]: districtName },
        },
      });

      if (!districtRecord) {
        // Also check if district exists with any suffix (e.g. "Gurdaspur Tehsil" or "Gurdaspur District")
        districtRecord = await District.findOne({
          where: {
            stateId: stateRecord.id,
            name: { [Op.like]: `%${districtName}%` },
          },
        });
      }

      if (!districtRecord) {
        [districtRecord] = await District.findOrCreate({
          where: { name: districtName, stateId: stateRecord.id },
          defaults: {
            name: districtName,
            stateId: stateRecord.id,
            status: 'ACTIVE',
          },
        });
      }
    }

    // 3. Ensure City exists in DB
    let cityRecord = await City.findOne({
      where: {
        stateId: stateRecord.id,
        name: { [Op.like]: cityName },
      },
    });

    if (!cityRecord) {
      // Also check if city exists with suffix or partial match
      cityRecord = await City.findOne({
        where: {
          stateId: stateRecord.id,
          name: { [Op.like]: `%${cityName}%` },
        },
      });
    }

    if (cityRecord) {
      // If city exists but missing district link, associate it
      if (!cityRecord.districtId && districtRecord) {
        await cityRecord.update({ districtId: districtRecord.id });
      }
    } else {
      // Create new City record
      await City.create({
        name: cityName,
        stateId: stateRecord.id,
        districtId: districtRecord ? districtRecord.id : null,
        isPopular: false,
        status: 'ACTIVE',
      });
    }
  } catch (err) {
    console.error('Error auto-creating missing location master entry:', err);
  }
}
