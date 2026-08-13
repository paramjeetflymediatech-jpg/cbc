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

function generateQueryVariations(fullQuery: string): string[] {
  const queries: string[] = [fullQuery.trim()];

  const cleanHead = fullQuery.split('|')[0].split('–')[0].trim();

  // 1. Remove landmark phrases ('near ...', 'opp ...', 'opposite ...', 'behind ...', 'above ...', 'next to ...') and noise words ('modern tower', 'tower', 'building')
  const noLandmarks = fullQuery
    .replace(/\b(near|opp|opposite|behind|above|next to)\s+[^,]+/gi, '')
    .replace(/\b(modern tower|tower|building|flat|floor|block|room|shop)\b/gi, '')
    .replace(/\s+/g, ' ')
    .replace(/\s+,/g, ',')
    .replace(/,\s*,/g, ',')
    .trim();

  if (noLandmarks && !queries.includes(noLandmarks)) {
    queries.push(noLandmarks);
  }

  const parts = fullQuery.split(',').map((p) => p.trim()).filter(Boolean);
  const pincode = (fullQuery.match(/\b\d{6}\b/) || [''])[0];
  const stateMatch = fullQuery.match(/\b(Punjab|Haryana|Delhi|Maharashtra|Karnataka|Tamil Nadu|Telangana|Uttar Pradesh|Rajasthan|Gujarat)\b/i);
  const cityMatch = fullQuery.match(/\b(Ludhiana|Jalandhar|Amritsar|Mohali|Chandigarh|Patiala|Bathinda|Phagwara|Hoshiarpur|Delhi|Mumbai|Pune|Bangalore|Chennai|Kolkata|Hyderabad|Jaipur|Lucknow|Noida|Gurgaon|Faridabad|Ghaziabad)\b/i);

  const state = stateMatch ? stateMatch[0] : (parts.slice(-2).find((p) => !/\d{6}/.test(p) && p.toLowerCase() !== 'india') || 'Punjab');
  const city = cityMatch ? cityMatch[0] : (parts.slice(-3).find((p) => p !== state && !/\d{6}/.test(p) && p.toLowerCase() !== 'india') || 'Ludhiana');

  // 2. High Priority: Try Area / Suburb / Street + City + State (e.g. "Urban Estate Dugri, Ludhiana", "Basant Avenue, Ludhiana")
  if (parts.length >= 3) {
    for (let i = parts.length - 3; i >= 0; i--) {
      const suburb = parts[i];
      if (suburb && suburb.length > 3 && suburb.toLowerCase() !== city.toLowerCase() && suburb.toLowerCase() !== state.toLowerCase() && suburb.toLowerCase() !== 'india') {
        const qArea = `${suburb}, ${city}, ${state} ${pincode}`.replace(/\s+/g, ' ').trim();
        if (!queries.includes(qArea)) queries.push(qArea);

        if (cleanHead) {
          const qBrandArea = `${cleanHead}, ${suburb}, ${city}, ${state}`.replace(/\s+/g, ' ').trim();
          if (!queries.includes(qBrandArea)) queries.push(qBrandArea);
        }
      }
    }
  }

  // 3. Fallback: Generic Brand + City + State
  if (cleanHead && city) {
    const brandWithCity = `${cleanHead}, ${city}, ${state}, India`.replace(/\s+/g, ' ').replace(/,\s*,/g, ',').trim();
    if (!queries.includes(brandWithCity)) queries.push(brandWithCity);
  }

  if (cleanHead && !queries.includes(cleanHead)) {
    queries.push(cleanHead);
  }

  // 4. Try Pincode + City + State
  if (pincode && city) {
    const pinQuery = `${city}, ${state} ${pincode}`.trim();
    if (pinQuery && !queries.includes(pinQuery)) queries.push(pinQuery);
  }

  // 5. Fallback City + State + India
  if (city && state) {
    const cityQuery = `${city}, ${state}, India`;
    if (!queries.includes(cityQuery)) queries.push(cityQuery);
  }

  return queries;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q');

    if (!query || query.trim().length < 2) {
      return NextResponse.json({ suggestions: [] });
    }

    const rawQuery = query.trim();
    const queryVariations = generateQueryVariations(rawQuery);
    let suggestions: unknown[] = [];

    const googleApiKey = process.env.GOOGLE_MAPS_API_KEY || 'AIzaSyBjsJ5WTXCYZ989GwGOyUmCrcvB3JG_-hU';

    // 1. Try Google Places Autocomplete API FIRST for real-time typeahead
    if (googleApiKey) {
      try {
        const gUrl = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
          rawQuery
        )}&components=country:in&key=${googleApiKey}`;

        const gRes = await fetch(gUrl);
        if (gRes.ok) {
          const gData = await gRes.json();
          if (gData.status === 'OK' && Array.isArray(gData.predictions) && gData.predictions.length > 0) {
            suggestions = gData.predictions.map((item: { description: string; place_id?: string }, idx: number) => {
              return {
                place_id: item.place_id || `google_${idx}`,
                display_name: item.description,
                lat: '',
                lon: '',
                address: {},
              };
            });
          }
        }
      } catch {
        // Fallback
      }
    }

    // 2. Fallback: Try Nominatim Geocoding API if Google API yields 0 results
    if (suggestions.length === 0) {
      for (const qVar of queryVariations) {
        try {
          const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            qVar
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
              const filtered = data.filter((item: NominatimItem) => {
                const cc = (item.address?.country_code || '').toLowerCase();
                const country = (item.address?.country || '').toLowerCase();
                return cc === 'in' || country === 'india' || item.display_name?.includes('India');
              });

              if (filtered.length > 0) {
                suggestions = filtered;
                break;
              }
            }
          }
        } catch {
          // Continue to next variation
        }
      }
    }

    // 2. Fallback to Photon Komoot API if Nominatim returns 0 results
    if (suggestions.length === 0) {
      for (const qVar of queryVariations) {
        try {
          const photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(qVar)}&limit=10&lat=20.5937&lon=78.9629`;
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

              if (indiaFeatures.length > 0) {
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
                break;
              }
            }
          }
        } catch {
          // Continue to next variation
        }
      }
    }

    // 3. Fallback: Custom address entry
    if (suggestions.length === 0) {
      suggestions = [
        {
          place_id: 'custom_address_entry',
          display_name: `${rawQuery}, India`,
          lat: '20.5937',
          lon: '78.9629',
          address: {
            road: rawQuery,
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
