import { connectDB } from '@/lib/db';
import { State, District, City, Hospital, HospitalService, initAssociations } from '@/models';
import { Op } from 'sequelize';

export interface LocationsData {
  states: string[];
  districts: string[];
  cities: string[];
  locationsMap: Record<string, string[]>;
  stateDistrictMap: Record<string, string[]>;
  districtCityMap: Record<string, string[]>;
}

export async function getLocationsData(options?: {
  onlyWithHospitals?: boolean;
  serviceId?: number;
}): Promise<LocationsData> {
  try {
    await connectDB();
    initAssociations();

    const onlyWithHospitals = options?.onlyWithHospitals !== false; // defaults to true

    // Gather active cities, districts, and states from hospitals if onlyWithHospitals is true
    let allowedCityNames: Set<string> | null = null;
    let allowedStateNames: Set<string> | null = null;
    let allowedDistrictNames: Set<string> | null = null;

    let hospitalCityMap: Array<{ city?: string; district?: string; state?: string }> = [];

    if (onlyWithHospitals) {
      let hospitalIds: number[] | null = null;

      if (options?.serviceId) {
        const hsRecords = await HospitalService.findAll({
          where: { serviceId: options.serviceId, status: 'ACTIVE' },
          attributes: ['hospitalId'],
        });
        hospitalIds = hsRecords.map((hs) => hs.hospitalId);
      }

      const hospitalWhere: any = {
        status: 'APPROVED',
        accountStatus: 'ACTIVE',
      };

      if (hospitalIds !== null) {
        hospitalWhere.id = { [Op.in]: hospitalIds };
      }

      const activeHospitals = await Hospital.findAll({
        where: hospitalWhere,
        attributes: ['id', 'city', 'district', 'state'],
      });

      allowedCityNames = new Set<string>();
      allowedStateNames = new Set<string>();
      allowedDistrictNames = new Set<string>();
      hospitalCityMap = activeHospitals.map((h) => ({
        city: h.city?.trim(),
        district: h.district?.trim(),
        state: h.state?.trim(),
      }));

      hospitalCityMap.forEach((h) => {
        if (h.city) allowedCityNames!.add(h.city.toLowerCase());
        if (h.state) allowedStateNames!.add(h.state.toLowerCase());
        if (h.district) allowedDistrictNames!.add(h.district.toLowerCase());
      });
    }

    const states = await State.findAll({
      where: { status: 'ACTIVE' },
      include: [
        {
          model: District,
          as: 'districts',
          where: { status: 'ACTIVE' },
          required: false,
          include: [
            {
              model: City,
              as: 'cities',
              where: { status: 'ACTIVE' },
              required: false,
            },
          ],
        },
        {
          model: City,
          as: 'cities',
          where: { status: 'ACTIVE' },
          required: false,
        },
      ],
      order: [
        ['name', 'ASC'],
        [{ model: District, as: 'districts' }, 'name', 'ASC'],
        [{ model: City, as: 'cities' }, 'name', 'ASC'],
      ],
    });

    const stateNamesSet = new Set<string>();
    const allDistrictsSet = new Set<string>();
    const allCitiesSet = new Set<string>();

    const locationsMap: Record<string, string[]> = {};
    const stateDistrictMap: Record<string, string[]> = {};
    const districtCityMap: Record<string, string[]> = {};

    states.forEach((st: any) => {
      const sName = st.name;
      const dList: string[] = [];
      const directCityList: string[] = [];

      (st.districts || []).forEach((d: any) => {
        const dName = d.name;

        const filteredCities = (d.cities || [])
          .map((c: any) => c.name)
          .filter((cName: string) => {
            if (!onlyWithHospitals || !allowedCityNames) return true;
            return allowedCityNames.has(cName.toLowerCase().trim());
          });

        if (filteredCities.length > 0) {
          districtCityMap[dName] = filteredCities;
          filteredCities.forEach((cName: string) => allCitiesSet.add(cName));
          allDistrictsSet.add(dName);
          dList.push(dName);
        }
      });

      (st.cities || []).forEach((c: any) => {
        const cName = c.name;
        if (!onlyWithHospitals || !allowedCityNames || allowedCityNames.has(cName.toLowerCase().trim())) {
          directCityList.push(cName);
          allCitiesSet.add(cName);
        }
      });

      if (dList.length > 0 || directCityList.length > 0) {
        stateNamesSet.add(sName);
        stateDistrictMap[sName] = dList;
        locationsMap[sName] = directCityList;
      }
    });

    // Also include any hospital city/state directly in case it is not registered in the master hierarchy tables
    if (onlyWithHospitals && hospitalCityMap.length > 0) {
      hospitalCityMap.forEach((h) => {
        if (h.city) {
          allCitiesSet.add(h.city);
        }
        if (h.state) {
          stateNamesSet.add(h.state);
          if (!locationsMap[h.state]) {
            locationsMap[h.state] = [];
          }
          if (h.city && !locationsMap[h.state].includes(h.city)) {
            locationsMap[h.state].push(h.city);
          }
        }
        if (h.district) {
          allDistrictsSet.add(h.district);
          if (h.state) {
            if (!stateDistrictMap[h.state]) {
              stateDistrictMap[h.state] = [];
            }
            if (!stateDistrictMap[h.state].includes(h.district)) {
              stateDistrictMap[h.state].push(h.district);
            }
          }
          if (h.city) {
            if (!districtCityMap[h.district]) {
              districtCityMap[h.district] = [];
            }
            if (!districtCityMap[h.district].includes(h.city)) {
              districtCityMap[h.district].push(h.city);
            }
          }
        }
      });
    }

    return {
      states: Array.from(stateNamesSet).sort(),
      districts: Array.from(allDistrictsSet).sort(),
      cities: Array.from(allCitiesSet).sort(),
      locationsMap,
      stateDistrictMap,
      districtCityMap,
    };
  } catch (err) {
    console.error('Error in getLocationsData:', err);
    return {
      states: [],
      districts: [],
      cities: [],
      locationsMap: {},
      stateDistrictMap: {},
      districtCityMap: {},
    };
  }
}
