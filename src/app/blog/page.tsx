import React from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { connectDB } from '@/lib/db';
import { BlogPost } from '@/models';
import Link from 'next/link';
import Image from 'next/image';
import { Search, Calendar, Clock, User, ArrowRight, Sparkles, BookOpen, ChevronLeft, ChevronRight } from 'lucide-react';
import { Op } from 'sequelize';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  const { getPageMetadata } = await import('@/lib/seo');
  return getPageMetadata(
    '/blog',
    'Health & Medical Blogs | Clinic By Choice',
    'Read latest medical articles, health tips, surgical procedure guides, and healthcare insights from expert doctors and surgeons at Clinic By Choice.'
  );
}

interface PageProps {
  searchParams: Promise<{ category?: string; search?: string; page?: string }>;
}

export default async function BlogsIndexPage({ searchParams }: PageProps) {
  const { category, search, page } = await searchParams;
  const currentPage = parseInt(page || '1', 10);
  const limit = 9;
  const offset = (currentPage - 1) * limit;

  await connectDB();
  const { getPageSchemaMarkup } = await import('@/lib/seo');
  const schemaMarkup = await getPageSchemaMarkup('/blog');

  const where: Record<string | symbol, unknown> = {
    status: 'PUBLISHED',
  };

  if (category && category !== 'All') {
    where.category = category;
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

  const totalPages = Math.ceil(total / limit) || 1;

  // Get distinct categories
  const allCategoriesRaw = await BlogPost.findAll({
    where: { status: 'PUBLISHED' },
    attributes: ['category'],
    raw: true,
  });

  const categoriesSet = new Set<string>(['All']);
  allCategoriesRaw.forEach((b: { category?: string | null }) => {
    if (b.category) categoriesSet.add(b.category);
  });
  const categoriesList = Array.from(categoriesSet);

  // Featured Post (first post on page 1 with no search filter)
  const featuredBlog = currentPage === 1 && !search && (!category || category === 'All') && blogs.length > 0 ? blogs[0] : null;
  const displayBlogs = featuredBlog ? blogs.slice(1) : blogs;

  return (
    <div className="min-h-screen flex flex-col bg-[#f9fafb]">
      <Header />

      {/* Hero Banner */}
      <div
        className="text-white py-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #101828 0%, #1d2939 60%, #fd1d74 150%)' }}
      >
        <div className="max-w-7xl mx-auto space-y-6 relative z-10">
          <div className="inline-flex items-center space-x-2 bg-pink-500/10 border border-pink-500/20 px-3.5 py-1.5 rounded-full">
            <Sparkles className="w-4 h-4 text-[#ec2c6c]" />
            <span className="text-xs font-bold uppercase tracking-wider text-[#ec2c6c]">
              Medical Insights & Health Guidance
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-white max-w-3xl leading-tight">
            Clinic By Choice Medical Blog & Articles
          </h1>

          <p className="text-gray-300 text-sm sm:text-base max-w-2xl leading-relaxed font-medium">
            Explore trusted medical articles, surgical procedure breakdowns, recovery tips, and clinical advice written by leading doctors and healthcare professionals.
          </p>

          {/* Search Form */}
          <form action="/blog" method="GET" className="max-w-2xl flex flex-col sm:flex-row gap-2 pt-2">
            {category && category !== 'All' && <input type="hidden" name="category" value={category} />}
            <div className="relative flex-1">
              <Search className="w-5 h-5 text-gray-400 absolute left-4 top-3.5" />
              <input
                type="text"
                name="search"
                defaultValue={search || ''}
                placeholder="Search health topics, procedures (e.g. Knee, Surgery, Cancer)..."
                className="w-full pl-12 pr-4 py-3.5 bg-white text-gray-900 placeholder-gray-400 rounded-2xl text-sm font-semibold shadow-lg focus:outline-none focus:ring-2 focus:ring-[#fd1d74]"
              />
            </div>
            <button
              type="submit"
              className="bg-[#fd1d74] hover:bg-[#d41f5a] text-white px-7 py-3.5 rounded-2xl font-bold text-sm transition-all shadow-lg flex items-center justify-center space-x-2 flex-shrink-0"
            >
              <span>Search Articles</span>
            </button>
          </form>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-1 w-full space-y-12">
        {/* Category Pills Bar */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none border-b border-gray-200">
          {categoriesList.map((cat) => {
            const isActive = (category || 'All') === cat;
            const queryParams = new URLSearchParams();
            if (cat !== 'All') queryParams.set('category', cat);
            if (search) queryParams.set('search', search);

            const linkUrl = `/blog${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

            return (
              <Link
                key={cat}
                href={linkUrl}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-[#fd1d74] text-white shadow-md'
                    : 'bg-white text-gray-700 hover:bg-pink-50 hover:text-[#fd1d74] border border-gray-200'
                }`}
              >
                {cat}
              </Link>
            );
          })}
        </div>

        {/* Featured Article Hero Card (Page 1) */}
        {featuredBlog && (
          <div className="bg-white rounded-3xl overflow-hidden shadow-xl border border-gray-100 hover:shadow-2xl transition-all duration-300 group grid grid-cols-1 lg:grid-cols-12">
            <div className="lg:col-span-7 relative h-72 lg:h-auto min-h-[320px] bg-gray-900">
              <Image
                src={
                  featuredBlog.image ||
                  'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=1200&q=80'
                }
                alt={featuredBlog.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute top-4 left-4">
                <span className="bg-[#fd1d74] text-white text-xs font-black px-3.5 py-1.5 rounded-full shadow-lg uppercase tracking-wider">
                  ★ Featured Health Article
                </span>
              </div>
            </div>

            <div className="lg:col-span-5 p-8 lg:p-10 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-3 text-xs font-bold text-gray-500">
                  <span className="text-[#fd1d74] font-black uppercase">{featuredBlog.category || 'General Health'}</span>
                  <span>•</span>
                  <span className="flex items-center space-x-1">
                    <Clock className="w-3.5 h-3.5 text-gray-400" />
                    <span>{featuredBlog.readTime || '5 min read'}</span>
                  </span>
                </div>

                <Link href={`/blog/${featuredBlog.slug}`}>
                  <h2 className="text-2xl lg:text-3xl font-extrabold text-gray-900 group-hover:text-[#fd1d74] transition-colors leading-snug">
                    {featuredBlog.title}
                  </h2>
                </Link>

                <p className="text-gray-600 text-sm leading-relaxed line-clamp-3">
                  {featuredBlog.excerpt}
                </p>
              </div>

              <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                <div className="flex items-center space-x-2 text-xs font-semibold text-gray-700">
                  <div className="w-7 h-7 rounded-full bg-pink-100 text-[#fd1d74] flex items-center justify-center font-bold">
                    <User className="w-4 h-4" />
                  </div>
                  <span>{featuredBlog.author}</span>
                </div>

                <Link
                  href={`/blog/${featuredBlog.slug}`}
                  className="inline-flex items-center space-x-2 text-sm font-extrabold text-[#fd1d74] hover:translate-x-1 transition-transform"
                >
                  <span>Read Article</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Blog Cards Grid */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-extrabold text-gray-900">
              {search ? `Search Results for "${search}"` : category && category !== 'All' ? `${category} Articles` : 'All Medical Articles'} ({total})
            </h3>
            {(search || (category && category !== 'All')) && (
              <Link href="/blog" className="text-xs font-bold text-[#fd1d74] hover:underline">
                Clear Filters
              </Link>
            )}
          </div>

          {displayBlogs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {displayBlogs.map((blog: BlogPost) => (
                <article
                  key={blog.id}
                  className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col group"
                >
                  <Link href={`/blog/${blog.slug}`} className="relative h-48 w-full bg-gray-100 block overflow-hidden">
                    <Image
                      src={
                        blog.image ||
                        'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=800&q=80'
                      }
                      alt={blog.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3">
                      <span className="bg-[#101828]/80 backdrop-blur-xs text-white text-[11px] font-bold px-3 py-1 rounded-full border border-white/20">
                        {blog.category || 'Health'}
                      </span>
                    </div>
                  </Link>

                  <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2.5">
                      <div className="flex items-center space-x-3 text-xs font-semibold text-gray-400">
                        <span className="flex items-center space-x-1">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>
                            {blog.publishedAt
                              ? new Date(blog.publishedAt).toLocaleDateString(undefined, {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })
                              : 'Recent'}
                          </span>
                        </span>
                        <span>•</span>
                        <span className="flex items-center space-x-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{blog.readTime || '5 min'}</span>
                        </span>
                      </div>

                      <Link href={`/blog/${blog.slug}`}>
                        <h4 className="text-lg font-bold text-gray-900 group-hover:text-[#fd1d74] transition-colors leading-snug line-clamp-2">
                          {blog.title}
                        </h4>
                      </Link>

                      <p className="text-gray-600 text-xs leading-relaxed line-clamp-3">
                        {blog.excerpt || 'Read full medical details and expert procedure breakdowns in this article.'}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-gray-100 flex items-center justify-between text-xs">
                      <span className="font-semibold text-gray-700 truncate max-w-[150px]">
                        {blog.author || 'Clinic By Choice'}
                      </span>

                      <Link
                        href={`/blog/${blog.slug}`}
                        className="font-extrabold text-[#fd1d74] hover:translate-x-1 transition-transform flex items-center space-x-1"
                      >
                        <span>Read More</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200 space-y-3">
              <BookOpen className="w-12 h-12 text-gray-400 mx-auto" />
              <h4 className="text-lg font-bold text-gray-800">No Articles Found</h4>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                No blog posts matched your search criteria. Try searching for other medical topics or browse categories above.
              </p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-gray-200">
            <div className="text-xs font-semibold text-gray-500">
              Showing Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong> ({total} total articles)
            </div>

            <div className="flex items-center space-x-2">
              {/* Prev Button */}
              {currentPage > 1 ? (
                <Link
                  href={`/blog?${(() => {
                    const q = new URLSearchParams();
                    if (category) q.set('category', category);
                    if (search) q.set('search', search);
                    q.set('page', (currentPage - 1).toString());
                    return q.toString();
                  })()}`}
                  className="px-3.5 py-2 bg-white border border-gray-200 text-xs font-extrabold text-gray-700 rounded-xl hover:bg-gray-50 transition-all flex items-center space-x-1 shadow-xs"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous</span>
                </Link>
              ) : (
                <span className="px-3.5 py-2 bg-gray-100 border border-gray-200 text-xs font-extrabold text-gray-400 rounded-xl cursor-not-allowed flex items-center space-x-1 opacity-60">
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous</span>
                </span>
              )}

              {/* Page Numbers */}
              <div className="flex items-center space-x-1.5">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                  const queryParams = new URLSearchParams();
                  if (category) queryParams.set('category', category);
                  if (search) queryParams.set('search', search);
                  queryParams.set('page', pageNum.toString());

                  return (
                    <Link
                      key={pageNum}
                      href={`/blog?${queryParams.toString()}`}
                      className={`w-9 h-9 rounded-xl text-xs font-extrabold flex items-center justify-center transition-all ${
                        currentPage === pageNum
                          ? 'bg-[#fd1d74] text-white shadow-md'
                          : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                      }`}
                    >
                      {pageNum}
                    </Link>
                  );
                })}
              </div>

              {/* Next Button */}
              {currentPage < totalPages ? (
                <Link
                  href={`/blog?${(() => {
                    const q = new URLSearchParams();
                    if (category) q.set('category', category);
                    if (search) q.set('search', search);
                    q.set('page', (currentPage + 1).toString());
                    return q.toString();
                  })()}`}
                  className="px-3.5 py-2 bg-white border border-gray-200 text-xs font-extrabold text-gray-700 rounded-xl hover:bg-gray-50 transition-all flex items-center space-x-1 shadow-xs"
                >
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              ) : (
                <span className="px-3.5 py-2 bg-gray-100 border border-gray-200 text-xs font-extrabold text-gray-400 rounded-xl cursor-not-allowed flex items-center space-x-1 opacity-60">
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
                </span>
              )}
            </div>
          </div>
        )}

        {/* Patient Consultation CTA Banner */}
        <div className="bg-gradient-to-r from-[#101828] to-[#1d2939] text-white rounded-3xl p-8 sm:p-12 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl relative overflow-hidden">
          <div className="space-y-2 max-w-2xl relative z-10">
            <span className="text-xs font-extrabold text-[#fd1d74] uppercase tracking-wider">Need Medical Consultation?</span>
            <h3 className="text-2xl sm:text-3xl font-black text-white">Find Top Accredited Hospitals & Doctors</h3>
            <p className="text-gray-300 text-sm leading-relaxed">
              Connect with top multi-specialty hospitals in India for specialized treatments, expert second opinions, and affordable surgeries.
            </p>
          </div>
          <Link
            href="/contact-us"
            className="bg-[#fd1d74] hover:bg-[#d41f5a] text-white font-extrabold px-8 py-4 rounded-2xl shadow-xl transition-transform hover:scale-105 flex-shrink-0 text-sm"
          >
            Book Free Consultation
          </Link>
        </div>
      </main>

      <Footer />

      {schemaMarkup && (
        schemaMarkup.includes('<script') ? (
          <span
            suppressHydrationWarning
            dangerouslySetInnerHTML={{ __html: schemaMarkup }}
          />
        ) : (
          <script
            type="application/ld+json"
            suppressHydrationWarning
            dangerouslySetInnerHTML={{ __html: schemaMarkup }}
          />
        )
      )}
    </div>
  );
}
