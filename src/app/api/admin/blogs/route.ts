import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { BlogPost } from '@/models';
import { Op } from 'sequelize';

function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function GET(req: Request) {
  try {
    const authUser = await getAuthUser();
    if (!authUser || (authUser.role !== 'SUPER_ADMIN' && authUser.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search');
    const status = searchParams.get('status');

    const where: Record<string | symbol, unknown> = {};

    if (status && (status === 'PUBLISHED' || status === 'DRAFT')) {
      where.status = status;
    }

    if (search && search.trim() !== '') {
      const q = search.trim();
      where[Op.or] = [
        { title: { [Op.like]: `%${q}%` } },
        { slug: { [Op.like]: `%${q}%` } },
        { category: { [Op.like]: `%${q}%` } },
        { author: { [Op.like]: `%${q}%` } },
      ];
    }

    const blogs = await BlogPost.findAll({
      where,
      order: [['createdAt', 'DESC']],
    });

    const allBlogs = await BlogPost.findAll({ attributes: ['status', 'views'] });
    const total = allBlogs.length;
    const published = allBlogs.filter((b) => b.status === 'PUBLISHED').length;
    const drafts = allBlogs.filter((b) => b.status === 'DRAFT').length;
    const totalViews = allBlogs.reduce((sum, b) => sum + (b.views || 0), 0);

    return NextResponse.json({
      blogs,
      stats: { total, published, drafts, totalViews },
    });
  } catch (error) {
    console.error('Error fetching admin blogs:', error);
    return NextResponse.json({ error: 'Failed to fetch blogs' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const authUser = await getAuthUser();
    if (!authUser || (authUser.role !== 'SUPER_ADMIN' && authUser.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const body = await req.json();

    const {
      title,
      slug: customSlug,
      excerpt,
      content,
      image,
      category,
      author,
      readTime,
      tags,
      seoTitle,
      seoDescription,
      status,
    } = body;

    if (!title || !content) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 });
    }

    let finalSlug = customSlug ? generateSlug(customSlug) : generateSlug(title);
    if (!finalSlug) {
      finalSlug = `post-${Date.now()}`;
    }

    // Check slug uniqueness
    const existing = await BlogPost.findOne({ where: { slug: finalSlug } });
    if (existing) {
      finalSlug = `${finalSlug}-${Date.now()}`;
    }

    const isPublished = status === 'PUBLISHED';

    // Auto-calculate read time based on word count (200 words/min)
    const textContent = (content || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    const wordCount = textContent ? textContent.split(' ').filter(Boolean).length : 0;
    const computedReadTime = readTime || `${Math.max(1, Math.ceil(wordCount / 200))} min read`;

    const blog = await BlogPost.create({
      title,
      slug: finalSlug,
      excerpt: excerpt || null,
      content,
      image: image || null,
      category: category || 'General Health',
      author: author || authUser.name || 'Clinic By Choice Editorial Team',
      readTime: computedReadTime,
      tags: tags || null,
      seoTitle: seoTitle || null,
      seoDescription: seoDescription || null,
      status: isPublished ? 'PUBLISHED' : 'DRAFT',
      publishedAt: isPublished ? new Date() : null,
      views: 0,
    });

    return NextResponse.json({
      message: 'Blog post created successfully',
      blog,
    });
  } catch (error) {
    console.error('Error creating admin blog post:', error);
    return NextResponse.json({ error: 'Failed to create blog post' }, { status: 500 });
  }
}
