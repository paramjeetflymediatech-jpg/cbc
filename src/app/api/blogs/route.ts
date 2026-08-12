import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { BlogPost } from '@/models';
import { Op } from 'sequelize';

export async function GET(req: Request) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const tag = searchParams.get('tag');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '9', 10);
    const offset = (page - 1) * limit;

    const where: Record<string | symbol, unknown> = {
      status: 'PUBLISHED',
    };

    if (category && category !== 'All') {
      where.category = category;
    }

    if (tag) {
      where.tags = { [Op.like]: `%${tag}%` };
    }

    if (search && search.trim() !== '') {
      const q = search.trim();
      where[Op.or] = [
        { title: { [Op.like]: `%${q}%` } },
        { excerpt: { [Op.like]: `%${q}%` } },
        { content: { [Op.like]: `%${q}%` } },
        { tags: { [Op.like]: `%${q}%` } },
      ];
    }

    const { rows: blogs, count: total } = await BlogPost.findAndCountAll({
      where,
      order: [['publishedAt', 'DESC'], ['createdAt', 'DESC']],
      limit,
      offset,
    });

    // Get distinct active categories for filter tabs
    const allPublished = await BlogPost.findAll({
      where: { status: 'PUBLISHED' },
      attributes: ['category'],
      raw: true,
    });

    const categoriesSet = new Set<string>();
    allPublished.forEach((b: { category?: string | null }) => {
      if (b.category) categoriesSet.add(b.category);
    });

    return NextResponse.json({
      blogs,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
      categories: Array.from(categoriesSet),
    });
  } catch (error) {
    console.error('Error fetching blogs:', error);
    return NextResponse.json({ error: 'Failed to fetch blogs' }, { status: 500 });
  }
}
