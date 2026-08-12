import { unlink } from 'fs/promises';
import path from 'path';

/**
 * Deletes a local uploaded file given its relative URL (e.g., '/uploads/hospitals/foo/123-logo.jpg').
 * Safe against non-local URLs (e.g. https://...), missing files, and null/undefined values.
 */
export async function deleteLocalFile(fileUrl?: string | null): Promise<void> {
  if (!fileUrl || typeof fileUrl !== 'string') return;

  // Only attempt deletion for local /uploads/ paths
  if (!fileUrl.startsWith('/uploads/')) return;

  try {
    // Sanitize path to prevent directory traversal
    const relativePath = path.normalize(fileUrl.replace(/^\/uploads\//, '')).replace(/^(\.\.[\/\\])+/, '');
    
    // 1. Delete from public/uploads/
    const mainFilePath = path.join(process.cwd(), 'public', 'uploads', relativePath);
    try {
      await unlink(mainFilePath);
    } catch {}

    // 2. Delete from .next/standalone/public/uploads/ if running in standalone mode
    try {
      const standaloneFilePath = path.join(process.cwd(), '.next', 'standalone', 'public', 'uploads', relativePath);
      await unlink(standaloneFilePath);
    } catch {}
  } catch (err) {
    console.warn('File cleanup notice:', (err as Error)?.message || err);
  }
}

/**
 * Compares an old image URL or array of old URLs against new image URL(s),
 * and deletes any local old image files that are no longer used.
 */
export async function cleanupOldImages(
  oldUrls: string | string[] | null | undefined,
  newUrls: string | string[] | null | undefined
): Promise<void> {
  const toArray = (val: string | string[] | null | undefined): string[] => {
    if (!val) return [];
    if (Array.isArray(val)) return val.filter(Boolean);
    return [val];
  };

  const oldList = toArray(oldUrls);
  const newList = toArray(newUrls);

  const removed = oldList.filter((url) => !newList.includes(url));

  for (const url of removed) {
    await deleteLocalFile(url);
  }
}
