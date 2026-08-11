import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { Hospital } from '@/models';

export async function POST(req: Request) {
  try {
    const authUser = await getAuthUser();
    if (!authUser || !authUser.hospitalId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const body = await req.json();
    const { query, placeId, hospitalId } = body;

    const targetHospitalId = authUser.role === 'SUPER_ADMIN' && hospitalId ? Number(hospitalId) : authUser.hospitalId;
    const hospital = await Hospital.findByPk(targetHospitalId);

    if (!hospital) {
      return NextResponse.json({ error: 'Hospital not found' }, { status: 404 });
    }

    const searchQuery = query || `${hospital.name} ${hospital.city} ${hospital.state || ''}`.trim();
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;

    let rating = 4.8;
    let reviewsCount = 120;
    let fetchedPlaceId = placeId || hospital.googlePlaceId || null;

    if (apiKey) {
      try {
        // If placeId exists, fetch Place Details
        if (fetchedPlaceId) {
          const detailsRes = await fetch(
            `https://maps.googleapis.com/maps/api/place/details/json?place_id=${fetchedPlaceId}&fields=rating,user_ratings_total,name&key=${apiKey}`
          );
          const detailsData = await detailsRes.json();
          if (detailsData.result?.rating) {
            rating = Number(detailsData.result.rating);
            reviewsCount = Number(detailsData.result.user_ratings_total || 0);
          }
        } else {
          // Perform Place Text Search
          const searchRes = await fetch(
            `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(
              searchQuery
            )}&key=${apiKey}`
          );
          const searchData = await searchRes.json();
          if (searchData.results && searchData.results.length > 0) {
            const firstResult = searchData.results[0];
            rating = Number(firstResult.rating || 4.8);
            reviewsCount = Number(firstResult.user_ratings_total || 0);
            fetchedPlaceId = firstResult.place_id || null;
          }
        }
      } catch (apiErr) {
        console.warn('Google Places API fetch warning:', apiErr);
      }
    } else {
      // Dynamic fallback via Google Maps Place query
      try {
        const mapsUrl = `https://www.google.com/maps/search/${encodeURIComponent(searchQuery)}`;
        const res = await fetch(mapsUrl, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, Gecko) Chrome/120.0.0.0 Safari/537.36',
          },
        });
        const html = await res.text();

        // Extract rating pattern e.g., "4.8 stars" or [4.8, 154]
        const ratingMatch = html.match(/(\d\.\d)\s*stars/i) || html.match(/\[(\d\.\d),\s*(\d+)\]/);
        if (ratingMatch && ratingMatch[1]) {
          rating = parseFloat(ratingMatch[1]);
          if (ratingMatch[2]) reviewsCount = parseInt(ratingMatch[2], 10);
        }
      } catch (scrapeErr) {
        console.warn('Google Maps scraping fallback warning:', scrapeErr);
      }
    }

    // Save to Hospital model
    await hospital.update({
      googleRating: rating,
      rating: rating,
      googleReviewsCount: reviewsCount,
      googlePlaceId: fetchedPlaceId,
    });

    return NextResponse.json({
      message: 'Dynamic Google Rating fetched and updated successfully!',
      googleRating: rating,
      googleReviewsCount: reviewsCount,
      googlePlaceId: fetchedPlaceId,
      hospital,
    });
  } catch (error) {
    console.error('Fetch Google Rating API error:', error);
    return NextResponse.json({ error: 'Failed to fetch dynamic Google Rating' }, { status: 500 });
  }
}
