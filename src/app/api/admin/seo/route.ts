import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { SeoMetadata, Setting } from '@/models';

export async function GET() {
  try {
    const authUser = await getAuthUser();
    if (!authUser || (authUser.role !== 'SUPER_ADMIN' && authUser.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await connectDB();

    // Fetch SEO metadata overrides list
    const seoList = await SeoMetadata.findAll({
      order: [['path', 'ASC']],
    });

    // Fetch scripts settings
    const headerScriptSetting = await Setting.findOne({ where: { key: 'header_script' } });
    const footerScriptSetting = await Setting.findOne({ where: { key: 'footer_script' } });
    const gaSetting = await Setting.findOne({ where: { key: 'google_analytics_id' } });
    const gtmSetting = await Setting.findOne({ where: { key: 'google_tag_manager_id' } });
    const schemaSetting = await Setting.findOne({ where: { key: 'global_schema' } });

    return NextResponse.json({
      seoList,
      settings: {
        headerScript: headerScriptSetting ? headerScriptSetting.value : '',
        footerScript: footerScriptSetting ? footerScriptSetting.value : '',
        googleAnalyticsId: gaSetting ? gaSetting.value : '',
        googleTagManagerId: gtmSetting ? gtmSetting.value : '',
        globalSchema: schemaSetting ? schemaSetting.value : '',
      },
    });
  } catch (error) {
    console.error('Admin GET SEO error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const authUser = await getAuthUser();
    if (!authUser || (authUser.role !== 'SUPER_ADMIN' && authUser.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await connectDB();
    const body = await req.json();
    const { action } = body;

    if (action === 'save_scripts') {
      const { headerScript, footerScript, googleAnalyticsId, googleTagManagerId, globalSchema } = body;

      // Update or create header script
      const [headerSetting] = await Setting.findOrCreate({
        where: { key: 'header_script' },
        defaults: { key: 'header_script', value: headerScript || '' },
      });
      headerSetting.value = headerScript || '';
      await headerSetting.save();

      // Update or create footer script
      const [footerSetting] = await Setting.findOrCreate({
        where: { key: 'footer_script' },
        defaults: { key: 'footer_script', value: footerScript || '' },
      });
      footerSetting.value = footerScript || '';
      await footerSetting.save();

      // Update or create Google Analytics ID
      const [gaSetting] = await Setting.findOrCreate({
        where: { key: 'google_analytics_id' },
        defaults: { key: 'google_analytics_id', value: googleAnalyticsId || '' },
      });
      gaSetting.value = googleAnalyticsId || '';
      await gaSetting.save();

      // Update or create Google Tag Manager ID
      const [gtmSetting] = await Setting.findOrCreate({
        where: { key: 'google_tag_manager_id' },
        defaults: { key: 'google_tag_manager_id', value: googleTagManagerId || '' },
      });
      gtmSetting.value = googleTagManagerId || '';
      await gtmSetting.save();

      // Update or create global schema
      const [schemaSetting] = await Setting.findOrCreate({
        where: { key: 'global_schema' },
        defaults: { key: 'global_schema', value: globalSchema || '' },
      });
      schemaSetting.value = globalSchema || '';
      await schemaSetting.save();

      return NextResponse.json({ success: true, message: 'Global settings updated successfully' });
    }

    if (action === 'save_seo') {
      const { id, pageName, path, title, description, keywords, canonicalUrl, ogImage, ogTitle, ogDescription, robotsIndex, schemaMarkup } = body;

      if (!pageName || !pageName.trim()) {
        return NextResponse.json({ error: 'Page Name is required' }, { status: 400 });
      }
      if (!path || !path.trim()) {
        return NextResponse.json({ error: 'Path is required' }, { status: 400 });
      }
      if (!title || !title.trim()) {
        return NextResponse.json({ error: 'Meta title is required' }, { status: 400 });
      }
      if (!description || !description.trim()) {
        return NextResponse.json({ error: 'Meta description is required' }, { status: 400 });
      }

      const normalizedPath = path.trim().toLowerCase();

      // Ensure normalizedPath starts with /
      if (!normalizedPath.startsWith('/')) {
        return NextResponse.json({ error: 'Path must start with a slash (e.g. /about-us)' }, { status: 400 });
      }

      if (id) {
        // Edit existing SEO entry
        const existing = await SeoMetadata.findByPk(id);
        if (!existing) {
          return NextResponse.json({ error: 'SEO record not found' }, { status: 404 });
        }

        // Check if updating path causes a duplicate
        const duplicate = await SeoMetadata.findOne({ where: { path: normalizedPath } });
        if (duplicate && duplicate.id !== Number(id)) {
          return NextResponse.json({ error: 'SEO path configuration already exists' }, { status: 400 });
        }

        existing.pageName = pageName.trim();
        existing.path = normalizedPath;
        existing.title = title.trim();
        existing.description = description.trim();
        existing.keywords = keywords ? keywords.trim() : null;
        existing.canonicalUrl = canonicalUrl ? canonicalUrl.trim() : null;
        existing.ogImage = ogImage ? ogImage.trim() : null;
        existing.ogTitle = ogTitle ? ogTitle.trim() : null;
        existing.ogDescription = ogDescription ? ogDescription.trim() : null;
        existing.robotsIndex = robotsIndex ? robotsIndex.trim() : 'index, follow';
        existing.schemaMarkup = schemaMarkup ? schemaMarkup.trim() : null;
        await existing.save();

        return NextResponse.json({ success: true, seo: existing, message: 'SEO configuration updated' });
      } else {
        // Create new SEO entry
        const duplicate = await SeoMetadata.findOne({ where: { path: normalizedPath } });
        if (duplicate) {
          return NextResponse.json({ error: 'SEO path configuration already exists' }, { status: 400 });
        }

        const newSeo = await SeoMetadata.create({
          pageName: pageName.trim(),
          path: normalizedPath,
          title: title.trim(),
          description: description.trim(),
          keywords: keywords ? keywords.trim() : null,
          canonicalUrl: canonicalUrl ? canonicalUrl.trim() : null,
          ogImage: ogImage ? ogImage.trim() : null,
          ogTitle: ogTitle ? ogTitle.trim() : null,
          ogDescription: ogDescription ? ogDescription.trim() : null,
          robotsIndex: robotsIndex ? robotsIndex.trim() : 'index, follow',
          schemaMarkup: schemaMarkup ? schemaMarkup.trim() : null,
        });

        return NextResponse.json({ success: true, seo: newSeo, message: 'SEO configuration created' });
      }
    }

    if (action === 'delete_seo') {
      const { id } = body;
      if (!id) {
        return NextResponse.json({ error: 'ID is required to delete' }, { status: 400 });
      }

      const existing = await SeoMetadata.findByPk(id);
      if (!existing) {
        return NextResponse.json({ error: 'SEO record not found' }, { status: 404 });
      }

      await existing.destroy();
      return NextResponse.json({ success: true, message: 'SEO configuration deleted' });
    }

    if (action === 'bulk_delete' || action === 'bulk_delete_seo') {
      const { ids } = body;
      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return NextResponse.json({ error: 'IDs array is required for bulk delete' }, { status: 400 });
      }

      const { Op } = await import('sequelize');
      const deletedCount = await SeoMetadata.destroy({
        where: { id: { [Op.in]: ids } },
      });

      return NextResponse.json({
        success: true,
        message: `${deletedCount} SEO configuration(s) deleted successfully`,
        deletedCount,
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Admin POST SEO error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const authUser = await getAuthUser();
    if (!authUser || (authUser.role !== 'SUPER_ADMIN' && authUser.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await connectDB();
    const body = await req.json();
    const { ids } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'IDs array is required for bulk delete' }, { status: 400 });
    }

    const { Op } = await import('sequelize');
    const deletedCount = await SeoMetadata.destroy({
      where: { id: { [Op.in]: ids } },
    });

    return NextResponse.json({
      success: true,
      message: `${deletedCount} SEO configuration(s) deleted successfully`,
      deletedCount,
    });
  } catch (error) {
    console.error('Admin DELETE SEO error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
