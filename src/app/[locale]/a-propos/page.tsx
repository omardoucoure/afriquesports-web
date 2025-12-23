import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Header, Footer } from "@/components/layout";
import { Breadcrumb } from "@/components/ui";
import Image from "next/image";

interface AboutPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: AboutPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations("about");
  const baseUrl = "https://www.afriquesports.net";
  const pagePath = "/a-propos";
  const canonicalUrl = locale === "fr" ? `${baseUrl}${pagePath}` : `${baseUrl}/${locale}${pagePath}`;

  const titles: Record<string, string> = {
    fr: "À propos de nous | Afrique Sports",
    en: "About Us | Afrique Sports",
    es: "Acerca de nosotros | Afrique Sports",
    ar: "من نحن | Afrique Sports"
  };

  const descriptions: Record<string, string> = {
    fr: "Découvrez Afrique Sports, votre source d'actualités pour le football africain. Notre mission, notre équipe et notre engagement envers l'excellence journalistique.",
    en: "Discover Afrique Sports, your source for African football news. Our mission, our team, and our commitment to journalistic excellence.",
    es: "Descubre Afrique Sports, tu fuente de noticias de fútbol africano. Nuestra misión, nuestro equipo y nuestro compromiso con la excelencia periodística.",
    ar: "اكتشف أفريقيا سبورت، مصدرك لأخبار كرة القدم الأفريقية. مهمتنا وفريقنا والتزامنا بالتميز الصحفي."
  };

  return {
    title: titles[locale] || titles.fr,
    description: descriptions[locale] || descriptions.fr,
    alternates: {
      canonical: canonicalUrl,
      languages: {
        "fr-FR": `${baseUrl}${pagePath}`,
        "en-US": `${baseUrl}/en${pagePath}`,
        "es-ES": `${baseUrl}/es${pagePath}`,
        "ar-SA": `${baseUrl}/ar${pagePath}`,
        "x-default": `${baseUrl}${pagePath}`,
      },
    },
    openGraph: {
      title: titles[locale] || titles.fr,
      description: descriptions[locale] || descriptions.fr,
      type: "website",
      siteName: "Afrique Sports",
      url: canonicalUrl,
      images: [{ url: "https://www.afriquesports.net/opengraph-image", width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: titles[locale] || titles.fr,
      description: descriptions[locale] || descriptions.fr,
      images: ["https://www.afriquesports.net/opengraph-image"],
    },
  };
}

export default async function AboutPage({ params }: AboutPageProps) {
  const { locale } = await params;
  const t = await getTranslations("about");
  const tNav = await getTranslations("nav");

  const breadcrumbItems = [
    { label: tNav("home"), href: "/" },
    { label: tNav("about"), href: "/a-propos" },
  ];

  const socialLinks = [
    {
      name: "Facebook",
      href: "https://facebook.com/afriquesports",
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      ),
    },
    {
      name: "Twitter",
      href: "https://twitter.com/afriquesports",
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
    },
    {
      name: "Instagram",
      href: "https://instagram.com/afriquesports",
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
        </svg>
      ),
    },
    {
      name: "YouTube",
      href: "https://youtube.com/@afriquesports",
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
      ),
    },
    {
      name: "TikTok",
      href: "https://tiktok.com/@afriquesports",
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
        </svg>
      ),
    },
  ];

  const teamMembers = [
    {
      name: "Équipe Editorial",
      role: t("team.editorial"),
      description: t("team.editorialDesc")
    },
    {
      name: "Journalistes",
      role: t("team.journalists"),
      description: t("team.journalistsDesc")
    },
    {
      name: "Analystes",
      role: t("team.analysts"),
      description: t("team.analystsDesc")
    },
  ];

  return (
    <>
      <Header />

      <main className="min-h-screen bg-[#F6F6F6] pt-header">
        {/* Breadcrumb */}
        <div className="container-main py-4">
          <Breadcrumb items={breadcrumbItems} />
        </div>

        {/* Hero Section */}
        <div className="bg-gradient-to-r from-[#022a27] to-[#04453f] py-16">
          <div className="container-main">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
                {t("title")}
              </h1>
              <p className="text-xl text-white/90 leading-relaxed">
                {t("subtitle")}
              </p>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="container-main py-12">
          <div className="max-w-4xl mx-auto space-y-12">
            {/* Mission */}
            <section className="bg-white rounded-xl shadow-sm p-8">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
                {t("mission.title")}
              </h2>
              <p className="text-lg text-gray-700 leading-relaxed mb-4">
                {t("mission.description")}
              </p>
              <p className="text-lg text-gray-700 leading-relaxed">
                {t("mission.description2")}
              </p>
            </section>

            {/* Values */}
            <section className="bg-white rounded-xl shadow-sm p-8">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
                {t("values.title")}
              </h2>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center p-4">
                  <div className="w-16 h-16 bg-[#04453f]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-[#04453f]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">{t("values.quality")}</h3>
                  <p className="text-sm text-gray-600">{t("values.qualityDesc")}</p>
                </div>
                <div className="text-center p-4">
                  <div className="w-16 h-16 bg-[#04453f]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-[#04453f]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">{t("values.speed")}</h3>
                  <p className="text-sm text-gray-600">{t("values.speedDesc")}</p>
                </div>
                <div className="text-center p-4">
                  <div className="w-16 h-16 bg-[#04453f]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-[#04453f]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">{t("values.coverage")}</h3>
                  <p className="text-sm text-gray-600">{t("values.coverageDesc")}</p>
                </div>
              </div>
            </section>

            {/* Team */}
            <section className="bg-white rounded-xl shadow-sm p-8">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
                {t("team.title")}
              </h2>
              <p className="text-lg text-gray-700 mb-8">
                {t("team.description")}
              </p>
              <div className="grid md:grid-cols-3 gap-6">
                {teamMembers.map((member, idx) => (
                  <div key={idx} className="text-center p-6 bg-gray-50 rounded-lg">
                    <div className="w-20 h-20 bg-[#04453f] rounded-full flex items-center justify-center mx-auto mb-4 text-white text-2xl font-bold">
                      {member.name.charAt(0)}
                    </div>
                    <h3 className="font-bold text-gray-900 mb-1">{member.role}</h3>
                    <p className="text-sm text-gray-600">{member.description}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Contact Info */}
            <section className="bg-gradient-to-r from-[#022a27] to-[#04453f] rounded-xl p-8 text-white">
              <h2 className="text-2xl font-bold mb-6">
                {t("contact.title")}
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-bold mb-2">{t("contact.location")}</h3>
                  <p className="text-white/80">Dakar, Sénégal</p>
                </div>
                <div>
                  <h3 className="font-bold mb-2">{t("contact.phone")}</h3>
                  <a href="tel:+221778683200" className="text-white/80 hover:text-[#9DFF20]">
                    +221 77 868 32 00
                  </a>
                </div>
                <div>
                  <h3 className="font-bold mb-2">{t("contact.email")}</h3>
                  <a href="mailto:contact@afriquesports.net" className="text-white/80 hover:text-[#9DFF20]">
                    contact@afriquesports.net
                  </a>
                </div>
                <div>
                  <h3 className="font-bold mb-2">{t("contact.social")}</h3>
                  <div className="flex gap-3 mt-2">
                    {socialLinks.slice(0, 5).map((social) => (
                      <a
                        key={social.name}
                        href={social.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-[#9DFF20] hover:text-[#04453f] transition-all"
                        aria-label={social.name}
                      >
                        {social.icon}
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
