import { redirect } from 'next/navigation';

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function HospitalsCatchAllPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const queryString = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (typeof value === 'string' && value.trim() !== '') {
      queryString.set(key, value.trim());
    }
  }

  const query = queryString.toString();
  redirect(`/hospital${query ? `?${query}` : ''}`);
}
