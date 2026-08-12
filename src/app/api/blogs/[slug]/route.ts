import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { BlogPost } from '@/models';
import { Op } from 'sequelize';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    await connectDB();
    const { slug } = await params;

    const blog = await BlogPost.findOne({
      where: { slug: slug.toLowerCase(), status: 'PUBLISHED' },
    });

    if (!blog) {
      return NextResponse.json({ error: 'Blog post not found' }, { status: 404 });
    }

    // Increment views count safely
    await blog.increment('views', { by: 1 });

    // Fetch related articles (same category or recent, excluding current)
    const related = await BlogPost.findAll({
      where: {
        status: 'PUBLISHED',
        id: { [Op.ne]: blog.id },
        category: blog.category || undefined,
      },
      order: [['publishedAt', 'DESC']],
      limit: 3,
    });

    return NextResponse.json({
      blog,
      related,
    });
  } catch (error) {
    console.error('Error fetching blog detail:', error);
    return NextResponse.json({ error: 'Failed to fetch blog post' }, { status: 500 });
  }
}
