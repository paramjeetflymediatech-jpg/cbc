import { NextResponse } from 'next/server';

interface NominatimItem {
  display_name: string;
  lat: string;
  lon: string;
  address?: {
    country_code?: string;
    country?: string;
    city?: string;
    town?: string;
    village?: string;
    county?: string;
    state?: string;
    postcode?: string;
  };
}

interface PhotonFeature {
  geometry?: {
    coordinates?: [number, number];
  };
  properties?: {
    osm_id?: string | number;
    name?: string;
    street?: string;
    city?: string;
    town?: string;
    county?: string;
    state?: string;
    country?: string;
    countrycode?: string;
    postcode?: string;
  };
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q');

    if (!query || query.trim().length < 2) {
      return NextResponse.json({ suggestions: [] });
    }

    const cleanQuery = query.trim();
    let suggestions: unknown[] = [];

    // 1. Try Nominatim Geocoding API (Strictly India: countrycodes=in)
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        cleanQuery
      )}&addressdetails=1&limit=8&countrycodes=in`;

      const res = await fetch(url, {
        headers: {
          'User-Agent': 'ClinicByChoice/1.0 (info@clinicbychoice.com)',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        next: { revalidate: 3600 },
      });

      if (res.ok) {
        const data = (await res.json()) as NominatimItem[];
        if (Array.isArray(data) && data.length > 0) {
          // Filter strictly for India locations
          suggestions = data.filter((item: NominatimItem) => {
            const cc = (item.address?.country_code || '').toLowerCase();
            const country = (item.address?.country || '').toLowerCase();
            return cc === 'in' || country === 'india' || item.display_name?.includes('India');
          });
        }
      }
    } catch {
      // ignore & fallback to Photon
    }

    // 2. Fallback to Photon Komoot API if Nominatim returns 0 results
    if (suggestions.length === 0) {
      try {
        const photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(cleanQuery)}&limit=10&lat=20.5937&lon=78.9629`;
        const pRes = await fetch(photonUrl);
        if (pRes.ok) {
          const pData = (await pRes.json()) as { features?: PhotonFeature[] };
          if (pData && pData.features && Array.isArray(pData.features)) {
            const indiaFeatures = pData.features.filter((f: PhotonFeature) => {
              const props = f.properties || {};
              const cc = (props.countrycode || '').toLowerCase();
              const country = (props.country || '').toLowerCase();
              return cc === 'in' || country === 'india';
            });

            suggestions = indiaFeatures.map((f: PhotonFeature, idx: number) => {
              const props = f.properties || {};
              const coords = f.geometry?.coordinates || [78.9629, 20.5937];
              const parts = [
                props.name,
                props.street,
                props.city || props.town || props.county,
                props.state,
                'India',
              ].filter(Boolean);

              return {
                place_id: props.osm_id || `photon_${idx}`,
                display_name: parts.join(', '),
                lat: String(coords[1]),
                lon: String(coords[0]),
                address: {
                  road: props.street,
                  city: props.city || props.town || props.county,
                  state: props.state,
                  country: 'India',
                  country_code: 'in',
                  postcode: props.postcode,
                },
              };
            });
          }
        }
      } catch {
        // ignore
      }
    }

    // 3. Fallback: Custom address entry
    if (suggestions.length === 0) {
      suggestions = [
        {
          place_id: 'custom_address_entry',
          display_name: `${cleanQuery}, India`,
          lat: '20.5937',
          lon: '78.9629',
          address: {
            road: cleanQuery,
            city: '',
            state: '',
            country: 'India',
            country_code: 'in',
          },
        },
      ];
    }

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error('Location autocomplete error:', error);
    return NextResponse.json({ suggestions: [] });
  }
}
