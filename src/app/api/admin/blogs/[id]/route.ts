import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { BlogPost } from '@/models';
import { cleanupOldImages } from '@/lib/fileCleanup';

function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthUser();
    if (!authUser || (authUser.role !== 'SUPER_ADMIN' && authUser.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { id } = await params;

    const blog = await BlogPost.findByPk(id);
    if (!blog) {
      return NextResponse.json({ error: 'Blog post not found' }, { status: 404 });
    }

    return NextResponse.json({ blog });
  } catch (error) {
    console.error('Error fetching admin blog detail:', error);
    return NextResponse.json({ error: 'Failed to fetch blog post' }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthUser();
    if (!authUser || (authUser.role !== 'SUPER_ADMIN' && authUser.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { id } = await params;
    const body = await req.json();

    const blog = await BlogPost.findByPk(id);
    if (!blog) {
      return NextResponse.json({ error: 'Blog post not found' }, { status: 404 });
    }

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

    let updatedSlug = blog.slug;
    if (customSlug && customSlug !== blog.slug) {
      updatedSlug = generateSlug(customSlug);
      const existing = await BlogPost.findOne({ where: { slug: updatedSlug } });
      if (existing && existing.id !== blog.id) {
        updatedSlug = `${updatedSlug}-${Date.now()}`;
      }
    }

    const isPublishingNew = status === 'PUBLISHED' && blog.status !== 'PUBLISHED';

    if (image !== undefined && image !== blog.image) {
      await cleanupOldImages(blog.image, image);
    }

    await blog.update({
      title: title || blog.title,
      slug: updatedSlug,
      excerpt: excerpt !== undefined ? excerpt : blog.excerpt,
      content: content || blog.content,
      image: image !== undefined ? image : blog.image,
      category: category !== undefined ? category : blog.category,
      author: author !== undefined ? author : blog.author,
      readTime: readTime !== undefined ? readTime : blog.readTime,
      tags: tags !== undefined ? tags : blog.tags,
      seoTitle: seoTitle !== undefined ? seoTitle : blog.seoTitle,
      seoDescription: seoDescription !== undefined ? seoDescription : blog.seoDescription,
      status: status || blog.status,
      publishedAt: isPublishingNew ? new Date() : blog.publishedAt,
    });

    return NextResponse.json({
      message: 'Blog post updated successfully',
      blog,
    });
  } catch (error) {
    console.error('Error updating admin blog post:', error);
    return NextResponse.json({ error: 'Failed to update blog post' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthUser();
    if (!authUser || (authUser.role !== 'SUPER_ADMIN' && authUser.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { id } = await params;

    const blog = await BlogPost.findByPk(id);
    if (!blog) {
      return NextResponse.json({ error: 'Blog post not found' }, { status: 404 });
    }

    // Clean up local photo files
    await cleanupOldImages(blog.image, null);

    await blog.destroy();

    return NextResponse.json({ message: 'Blog post deleted successfully' });
  } catch (error) {
    console.error('Error deleting admin blog post:', error);
    return NextResponse.json({ error: 'Failed to delete blog post' }, { status: 500 });
  }
}
