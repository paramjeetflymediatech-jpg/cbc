import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const lat = searchParams.get('lat');
    const lon = searchParams.get('lon');

    if (!lat || !lon) {
      return NextResponse.json({ error: 'Latitude and Longitude are required' }, { status: 400 });
    }

    const googleApiKey = process.env.GOOGLE_MAPS_API_KEY || 'AIzaSyBjsJ5WTXCYZ989GwGOyUmCrcvB3JG_-hU';

    if (googleApiKey) {
      try {
        const gUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lon}&key=${googleApiKey}`;
        const gRes = await fetch(gUrl);
        if (gRes.ok) {
          const gData = await gRes.json();
          if (gData.status === 'OK' && Array.isArray(gData.results) && gData.results.length > 0) {
            const topResult = gData.results[0];
            
            let city = '';
            let state = '';
            let district = '';
            let admin2 = '';
            let admin3 = '';
            let postcode = '';
            
            if (topResult.address_components) {
              for (const comp of topResult.address_components) {
                if (comp.types.includes('locality')) city = comp.long_name;
                if (comp.types.includes('administrative_area_level_2')) admin2 = comp.long_name;
                if (comp.types.includes('administrative_area_level_3')) admin3 = comp.long_name;
                if (comp.types.includes('administrative_area_level_1')) state = comp.long_name;
                if (comp.types.includes('postal_code')) postcode = comp.long_name;
              }

              if (admin2.toLowerCase().includes('division') && admin3) {
                district = admin3;
              } else {
                district = admin3 && !admin2 ? admin3 : admin2;
              }
              district = district.replace(/\s+Division$/i, '').trim();
            }

            return NextResponse.json({
              display_name: topResult.formatted_address,
              address: {
                road: topResult.formatted_address,
                city: city,
                county: district,
                state: state,
                postcode: postcode,
                country: 'India',
                country_code: 'in',
              },
            });
          }
        }
      } catch {
        // Fallback to Nominatim
      }
    }

    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'ClinicByChoice/1.0 (info@clinicbychoice.com)',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Reverse geocode failed' }, { status: 500 });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Reverse geocode error:', error);
    return NextResponse.json({ error: 'Server error reverse geocoding' }, { status: 500 });
  }
}
