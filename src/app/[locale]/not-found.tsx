import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Header, HeaderSpacer, Footer } from '@/components/layout';

export default function NotFound() {
  const t = useTranslations('notFound');

  return (
    <div className="min-h-screen flex flex-col bg-[#F6F6F6]">
      <Header />
      <HeaderSpacer />

      <main className="flex-grow flex items-center justify-center px-4 py-16">
        <div className="max-w-2xl w-full text-center">
          {/* 404 Illustration */}
          <div className="mb-8">
            <div className="relative inline-block">
              <div className="text-[120px] md:text-[180px] font-bold text-[#9DFF20] leading-none select-none">
                404
              </div>
              <div className="absolute inset-0 blur-xl opacity-20 bg-[#9DFF20]"></div>
            </div>
          </div>

          {/* Error Message */}
          <h1 className="text-3xl md:text-4xl font-bold text-[#303030] mb-4">
            {t('title')}
          </h1>

          <p className="text-lg text-[#666666] mb-8 max-w-md mx-auto">
            {t('description')}
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#9DFF20] text-[#303030] font-semibold rounded-lg hover:bg-[#8FE610] transition-colors duration-200 min-w-[200px] justify-center"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              {t('homeButton')}
            </Link>

            <Link
              href="/search"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-[#303030] font-semibold rounded-lg hover:bg-gray-50 transition-colors duration-200 border-2 border-gray-200 min-w-[200px] justify-center"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {t('searchButton')}
            </Link>
          </div>

          {/* Popular Categories */}
          <div className="mt-12">
            <p className="text-sm text-[#666666] mb-4 font-medium">
              {t('popularCategories')}
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link
                href="/can-2025"
                className="px-4 py-2 bg-white rounded-full text-sm font-medium text-[#303030] hover:bg-[#9DFF20] transition-colors duration-200 border border-gray-200"
              >
                CAN 2025
              </Link>
              <Link
                href="/afrique"
                className="px-4 py-2 bg-white rounded-full text-sm font-medium text-[#303030] hover:bg-[#9DFF20] transition-colors duration-200 border border-gray-200"
              >
                {t('africa')}
              </Link>
              <Link
                href="/mercato"
                className="px-4 py-2 bg-white rounded-full text-sm font-medium text-[#303030] hover:bg-[#9DFF20] transition-colors duration-200 border border-gray-200"
              >
                Mercato
              </Link>
              <Link
                href="/europe"
                className="px-4 py-2 bg-white rounded-full text-sm font-medium text-[#303030] hover:bg-[#9DFF20] transition-colors duration-200 border border-gray-200"
              >
                Europe
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
