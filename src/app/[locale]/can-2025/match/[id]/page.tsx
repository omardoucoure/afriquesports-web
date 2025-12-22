import { Metadata } from 'next';

export async function generateMetadata({
  params
}: {
  params: Promise<{ id: string; locale: string }>;
}): Promise<Metadata> {
  const { id, locale } = await params;
  return {
    title: `Match ${id} - Test`
  };
}

export default async function MatchPage({
  params
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  const { id, locale } = await params;
  
  return (
    <div className="min-h-screen p-8">
      <h1>Match {id}</h1>
      <p>Locale: {locale}</p>
      <p>This is a minimal test page</p>
    </div>
  );
}
