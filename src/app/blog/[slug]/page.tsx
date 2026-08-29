import React from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import BlogContactSidebar from '@/components/ui/BlogContactSidebar';
import { connectDB } from '@/lib/db';
import { BlogPost } from '@/models';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Calendar, Clock, Eye, User, ShieldAlert, ArrowLeft, ArrowRight, Stethoscope } from 'lucide-react';
import { Op } from 'sequelize';
import { cleanBlogHtml } from '@/lib/blog-utils';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  try {
    await connectDB();
    const blog = await BlogPost.findOne({
      where: { slug: slug.toLowerCase(), status: 'PUBLISHED' },
    });

    if (!blog) {
      return { title: 'Article Not Found | Clinic By Choice' };
    }

    const metadata: any = {
      title: blog.seoTitle || `${blog.title} | Clinic By Choice Health Blog`,
      description: blog.seoDescription || blog.excerpt || `Read detailed medical insights on ${blog.title} at Clinic By Choice.`,
    };

    if (blog.seoKeywords) {
      metadata.keywords = blog.seoKeywords;
    }

    if (blog.canonicalUrl) {
      metadata.alternates = {
        canonical: blog.canonicalUrl,
      };
    }

    if (blog.robotsIndex) {
      metadata.robots = blog.robotsIndex;
    }

    // Open Graph
    const og: any = {};
    og.title = blog.ogTitle || blog.seoTitle || blog.title;
    og.description = blog.ogDescription || blog.seoDescription || blog.excerpt || blog.title;
    
    const ogImg = blog.ogImage || blog.image;
    if (ogImg) {
      og.images = [{ url: ogImg }];
    }

    metadata.openGraph = og;

    return metadata;
  } catch {
    return { title: 'Health Blog | Clinic By Choice' };
  }
}

export default async function BlogDetailPage({ params }: PageProps) {
  const { slug } = await params;
  await connectDB();

  const blog = await BlogPost.findOne({
    where: { slug: slug.toLowerCase(), status: 'PUBLISHED' },
  });

  if (!blog) {
    notFound();
  }

  // Increment view count
  try {
    await blog.increment('views', { by: 1 });
  } catch {}

  // Fetch 3 related blogs
  const relatedBlogs = await BlogPost.findAll({
    where: {
      status: 'PUBLISHED',
      id: { [Op.ne]: blog.id },
      category: blog.category || undefined,
    },
    order: [['publishedAt', 'DESC']],
    limit: 3,
  });

  const formattedDate = blog.publishedAt
    ? new Date(blog.publishedAt).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : new Date().toLocaleDateString();

  const blogSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `https://clinicbychoice.com/blog/${blog.slug}`
    },
    "headline": blog.title?.replace(/<[^>]*>?/gm, '').trim(),
    "description": (blog.excerpt || blog.seoDescription || blog.title)?.replace(/<[^>]*>?/gm, '').trim(),
    "image": blog.ogImage || blog.image ? [(blog.ogImage || blog.image)] : [],
    "datePublished": blog.publishedAt ? new Date(blog.publishedAt).toISOString() : new Date().toISOString(),
    "dateModified": blog.updatedAt ? new Date(blog.updatedAt).toISOString() : new Date().toISOString(),
    "author": {
      "@type": "Person",
      "name": blog.author || "Clinic By Choice"
    },
    "publisher": {
      "@type": "Organization",
      "name": "Clinic By Choice",
      "logo": {
        "@type": "ImageObject",
        "url": "https://clinicbychoice.com/images/logoblac.png"
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f9fafb]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(blogSchema) }} />
      <Header />

      {/* Article Header Banner */}
      <div className="bg-[#101828] text-white py-14 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Breadcrumbs */}
          <nav className="flex items-center space-x-2 text-xs font-semibold text-gray-400">
            <Link href="/" className="hover:text-white">Home</Link>
            <span>/</span>
            <Link href="/blog" className="hover:text-white">Blogs</Link>
            <span>/</span>
            <span className="text-[#ec2c6c] truncate max-w-[200px] sm:max-w-md">{blog.title}</span>
          </nav>

          {/* Category Pill & Meta */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="bg-[#ec2c6c] text-white text-xs font-extrabold px-3.5 py-1 rounded-full uppercase tracking-wider">
              {blog.category || 'General Health'}
            </span>
            <div className="flex items-center space-x-4 text-xs font-semibold text-gray-300">
              <span className="flex items-center space-x-1">
                <Calendar className="w-3.5 h-3.5 text-[#ec2c6c]" />
                <span>{formattedDate}</span>
              </span>
              <span>•</span>
              <span className="flex items-center space-x-1">
                <Clock className="w-3.5 h-3.5 text-[#ec2c6c]" />
                <span>{blog.readTime || '5 min read'}</span>
              </span>
              <span>•</span>
              <span className="flex items-center space-x-1">
                <Eye className="w-3.5 h-3.5 text-[#ec2c6c]" />
                <span>{blog.views + 1} views</span>
              </span>
            </div>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight max-w-4xl">
            {blog.title}
          </h1>

          {blog.excerpt && (
            <p className="text-gray-300 text-base sm:text-lg leading-relaxed font-medium max-w-3xl">
              {blog.excerpt}
            </p>
          )}

          {/* Author Block */}
          <div className="pt-4 border-t border-gray-800 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-pink-500/20 text-[#ec2c6c] border border-pink-500/30 flex items-center justify-center font-bold">
                <User className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs text-gray-400 block font-semibold">Written & Reviewed By</span>
                <span className="text-sm font-bold text-white">{blog.author || 'Clinic By Choice Team'}</span>
              </div>
            </div>

            <Link
              href="/blog"
              className="inline-flex items-center space-x-1.5 text-xs font-bold text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 px-3.5 py-2 rounded-xl border border-white/10 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Blogs</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content Layout with Contact Us Sidebar on Left Side */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-1 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Left Column (Sticky Contact Us Enquiry Form) */}
          <aside className="lg:col-span-4 lg:sticky lg:top-24 self-start order-2 lg:order-1 z-20 space-y-6">
            <BlogContactSidebar categoryName={blog.category} articleTitle={blog.title} />
          </aside>

          {/* Right Column (Article Detail Body & Related Posts) */}
          <div className="lg:col-span-8 order-1 lg:order-2 space-y-10">
            {/* Cover Image */}
            {blog.image && (
              <div className="relative h-[300px] sm:h-[450px] w-full rounded-3xl overflow-hidden shadow-2xl border border-gray-100">
                <Image src={blog.image} alt={blog.title} fill className="object-cover" priority />
              </div>
            )}

            {/* Article Body Container */}
            <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-xl border border-gray-100 space-y-8">
              <article
                className="prose prose-lg max-w-none text-gray-800 space-y-6 leading-relaxed font-normal
                  [&_h2]:text-2xl [&_h2]:font-extrabold [&_h2]:text-gray-900 [&_h2]:mt-8 [&_h2]:mb-4 [&_h2]:border-b [&_h2]:border-pink-100 [&_h2]:pb-2 [&_h2]:text-[#101828]
                  [&_h3]:text-xl [&_h3]:font-bold [&_h3]:text-[#ec2c6c] [&_h3]:mt-6 [&_h3]:mb-3
                  [&_p]:text-gray-700 [&_p]:leading-relaxed [&_p]:text-base
                  [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-2 [&_li]:text-gray-700
                  [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:space-y-2
                  [&_blockquote]:border-l-4 [&_blockquote]:border-[#ec2c6c] [&_blockquote]:bg-pink-50/60 [&_blockquote]:p-4 [&_blockquote]:rounded-r-2xl [&_blockquote]:italic [&_blockquote]:font-medium [&_blockquote]:text-gray-800
                  [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-xl [&_img]:my-4 [&_img]:shadow-md
                  [&_a]:text-[#ec2c6c] [&_a]:underline [&_a]:underline-offset-2 [&_a]:font-semibold hover:[&_a]:text-[#d41c59] [&_a]:transition-colors [&_a]:break-words"
                dangerouslySetInnerHTML={{ __html: cleanBlogHtml(blog.content) }}
              />

              {/* Article Tags */}
              {blog.tags && (
                <div className="pt-6 border-t border-gray-100 flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mr-2">Tags:</span>
                  {blog.tags.split(',').map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-semibold hover:bg-pink-50 hover:text-[#ec2c6c] transition-colors"
                    >
                      #{tag.trim()}
                    </span>
                  ))}
                </div>
              )}

              {/* Medical Disclaimer Box */}
              <div className="p-5 bg-amber-50/70 border border-amber-200 rounded-2xl flex items-start space-x-3 text-amber-900">
                <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-xs leading-relaxed space-y-1">
                  <h5 className="font-bold uppercase tracking-wider text-amber-900">Medical Information Disclaimer</h5>
                  <p className="text-amber-800 font-medium">
                    This article is intended solely for educational and informational purposes and does not constitute medical advice or diagnosis. Always consult with a qualified specialist doctor before making any healthcare decisions.
                  </p>
                </div>
              </div>
            </div>

            {/* Doctor Consultation CTA Card */}
            <div className="bg-white rounded-3xl p-8 border border-pink-100 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 rounded-2xl bg-pink-100 text-[#ec2c6c] flex items-center justify-center flex-shrink-0 font-bold">
                  <Stethoscope className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-lg font-extrabold text-gray-900">Consult with Top Medical Specialists</h4>
                  <p className="text-xs text-gray-500 font-medium">
                    Get expert guidance and treatment estimates from verified NABH-accredited hospitals.
                  </p>
                </div>
              </div>
              <Link href="/contact-us" className="cbc-btn-primary text-xs font-extrabold px-6 py-3 shadow-md flex-shrink-0">
                Request Callback
              </Link>
            </div>

            {/* Related Articles Section */}
            {relatedBlogs.length > 0 && (
              <div className="space-y-6 pt-6">
                <h3 className="text-2xl font-extrabold text-gray-900 border-b border-gray-200 pb-3">
                  Related Health Articles
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  {relatedBlogs.map((rel: BlogPost) => (
                    <article
                      key={rel.id}
                      className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col group"
                    >
                      <Link href={`/blog/${rel.slug}`} className="relative h-40 w-full bg-gray-100 block overflow-hidden">
                        <Image
                          src={
                            rel.image ||
                            'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=600&q=80'
                          }
                          alt={rel.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </Link>

                      <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                        <div className="space-y-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#ec2c6c] bg-pink-50 px-2.5 py-0.5 rounded-full">
                            {rel.category || 'Health'}
                          </span>
                          <Link href={`/blog/${rel.slug}`}>
                            <h5 className="font-bold text-gray-900 text-sm group-hover:text-[#ec2c6c] transition-colors leading-snug line-clamp-2">
                              {rel.title}
                            </h5>
                          </Link>
                        </div>

                        <Link
                          href={`/blog/${rel.slug}`}
                          className="text-xs font-bold text-[#ec2c6c] flex items-center space-x-1 hover:translate-x-1 transition-transform pt-2"
                        >
                          <span>Read Article</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
