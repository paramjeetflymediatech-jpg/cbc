import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q');

    if (!query || query.trim().length < 2) {
      return NextResponse.json({ suggestions: [] });
    }

    const cleanQuery = query.trim();
    let suggestions: any[] = [];

    // 1. Try Nominatim Geocoding API
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        cleanQuery
      )}&addressdetails=1&limit=5&countrycodes=in`;

      const res = await fetch(url, {
        headers: {
          'User-Agent': 'ClinicByChoice/1.0 (info@clinicbychoice.com)',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        next: { revalidate: 3600 },
      });

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          suggestions = data;
        }
      }
    } catch {
      // ignore & fallback to Photon
    }

    // 2. Fallback to Photon Komoot API if Nominatim returns 0 results
    if (suggestions.length === 0) {
      try {
        const photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(cleanQuery)}&limit=5`;
        const pRes = await fetch(photonUrl);
        if (pRes.ok) {
          const pData = await pRes.json();
          if (pData && pData.features && Array.isArray(pData.features)) {
            suggestions = pData.features.map((f: any, idx: number) => {
              const props = f.properties || {};
              const coords = f.geometry?.coordinates || [78.9629, 20.5937];
              const parts = [
                props.name,
                props.street,
                props.city || props.town || props.county,
                props.state,
                props.country || 'India',
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
                  country: props.country || 'India',
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

    // 3. Fallback: Always provide the typed address as a selectable option if no API matches
    if (suggestions.length === 0) {
      suggestions = [
        {
          place_id: 'custom_address_entry',
          display_name: cleanQuery,
          lat: '20.5937',
          lon: '78.9629',
          address: {
            road: cleanQuery,
            city: '',
            state: '',
            country: 'India',
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
