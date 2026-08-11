import { connectDB } from '@/lib/db';
import { State, District, City, initAssociations } from '@/models';

export interface LocationsData {
  states: string[];
  districts: string[];
  cities: string[];
  locationsMap: Record<string, string[]>;
  stateDistrictMap: Record<string, string[]>;
  districtCityMap: Record<string, string[]>;
}

export async function getLocationsData(): Promise<LocationsData> {
  try {
    await connectDB();
    initAssociations();

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

    const stateNames: string[] = [];
    const allDistrictsSet = new Set<string>();
    const allCitiesSet = new Set<string>();

    const locationsMap: Record<string, string[]> = {};
    const stateDistrictMap: Record<string, string[]> = {};
    const districtCityMap: Record<string, string[]> = {};

    states.forEach((st: any) => {
      const sName = st.name;
      stateNames.push(sName);

      const dList: string[] = [];
      (st.districts || []).forEach((d: any) => {
        dList.push(d.name);
        allDistrictsSet.add(d.name);

        const cList = (d.cities || []).map((c: any) => c.name);
        districtCityMap[d.name] = cList;
        cList.forEach((cName: string) => allCitiesSet.add(cName));
      });

      stateDistrictMap[sName] = dList;

      const directCityList = (st.cities || []).map((c: any) => c.name);
      directCityList.forEach((cName: string) => allCitiesSet.add(cName));
      locationsMap[sName] = directCityList;
    });

    return {
      states: stateNames,
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
