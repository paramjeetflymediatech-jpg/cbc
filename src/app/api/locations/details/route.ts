import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const place_id = searchParams.get('place_id');

    if (!place_id) {
      return NextResponse.json({ error: 'place_id is required' }, { status: 400 });
    }

    const googleApiKey = process.env.GOOGLE_MAPS_API_KEY || 'AIzaSyBjsJ5WTXCYZ989GwGOyUmCrcvB3JG_-hU';

    if (googleApiKey) {
      const gUrl = `https://maps.googleapis.com/maps/api/geocode/json?place_id=${place_id}&key=${googleApiKey}`;
      const gRes = await fetch(gUrl);
      if (gRes.ok) {
        const gData = await gRes.json();
        if (gData.status === 'OK' && Array.isArray(gData.results) && gData.results.length > 0) {
          const topResult = gData.results[0];
          const loc = topResult.geometry?.location || { lat: 20.5937, lng: 78.9629 };
          
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
            place_id: topResult.place_id,
            display_name: topResult.formatted_address,
            lat: loc.lat,
            lon: loc.lng,
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
    }

    return NextResponse.json({ error: 'Geocode failed' }, { status: 404 });
  } catch (error) {
    console.error('Details geocode error:', error);
    return NextResponse.json({ error: 'Server error fetching details' }, { status: 500 });
  }
}
