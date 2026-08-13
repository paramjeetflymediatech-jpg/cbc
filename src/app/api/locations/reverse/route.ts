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
            return NextResponse.json({
              display_name: topResult.formatted_address,
              address: {
                road: topResult.formatted_address,
                city: '',
                state: '',
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
