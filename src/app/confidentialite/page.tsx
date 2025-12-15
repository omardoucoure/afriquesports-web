import type { Metadata } from "next";
import { Header, Footer } from "@/components/layout";
import { Breadcrumb } from "@/components/ui";

export const metadata: Metadata = {
  title: "Politique de confidentialité",
  description: "Politique de confidentialité d'Afrique Sports. Découvrez comment nous collectons, utilisons et protégeons vos données personnelles.",
  openGraph: {
    title: "Politique de confidentialité | Afrique Sports",
    description: "Politique de confidentialité d'Afrique Sports.",
    type: "website",
    siteName: "Afrique Sports",
  },
  robots: {
    index: false,
    follow: true,
  },
};

const breadcrumbItems = [
  { label: "Accueil", href: "/" },
  { label: "Confidentialité", href: "/confidentialite" },
];

export default function ConfidentialitePage() {
  return (
    <>
      <Header />

      <main className="min-h-screen bg-[#F6F6F6] pt-[104px] md:pt-[88px] lg:pt-16">
        {/* Breadcrumb */}
        <div className="container-main py-4">
          <Breadcrumb items={breadcrumbItems} />
        </div>

        {/* Content */}
        <article className="container-main py-6 md:py-8">
          <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-sm p-6 md:p-10">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
              Politique de confidentialité
            </h1>

            <div className="prose prose-gray max-w-none">
              <p className="text-gray-600 mb-6">
                Dernière mise à jour : 14 décembre 2024
              </p>

              <section className="mb-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  1. Introduction
                </h2>
                <p className="text-gray-700 leading-relaxed">
                  Afrique Sports (&quot;nous&quot;, &quot;notre&quot;, &quot;nos&quot;) s&apos;engage à protéger la vie privée
                  des utilisateurs de notre site web afriquesports.net. Cette politique de confidentialité
                  explique comment nous collectons, utilisons, partageons et protégeons vos informations
                  personnelles.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  2. Données collectées
                </h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  Nous collectons les types de données suivants :
                </p>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li>Données de navigation (adresse IP, type de navigateur, pages visitées)</li>
                  <li>Cookies et technologies similaires</li>
                  <li>Données fournies volontairement via les formulaires de contact</li>
                  <li>Données d&apos;utilisation pour l&apos;analyse statistique</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  3. Utilisation des données
                </h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  Vos données sont utilisées pour :
                </p>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li>Améliorer l&apos;expérience utilisateur sur notre site</li>
                  <li>Analyser le trafic et les tendances d&apos;utilisation</li>
                  <li>Personnaliser le contenu affiché</li>
                  <li>Répondre à vos demandes de contact</li>
                  <li>Envoyer des notifications (si vous y avez consenti)</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  4. Cookies
                </h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  Notre site utilise des cookies pour :
                </p>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li><strong>Cookies essentiels :</strong> nécessaires au fonctionnement du site</li>
                  <li><strong>Cookies analytiques :</strong> Google Analytics pour comprendre l&apos;utilisation du site</li>
                  <li><strong>Cookies publicitaires :</strong> pour afficher des publicités pertinentes</li>
                </ul>
                <p className="text-gray-700 leading-relaxed mt-4">
                  Vous pouvez gérer vos préférences de cookies à tout moment via la bannière de consentement.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  5. Partage des données
                </h2>
                <p className="text-gray-700 leading-relaxed">
                  Nous ne vendons pas vos données personnelles. Nous pouvons partager certaines données
                  avec des partenaires de confiance (Google Analytics, régies publicitaires) dans le
                  cadre strict de nos activités et conformément à cette politique.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  6. Vos droits (RGPD)
                </h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  Conformément au Règlement Général sur la Protection des Données (RGPD), vous disposez des droits suivants :
                </p>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li>Droit d&apos;accès à vos données personnelles</li>
                  <li>Droit de rectification des données inexactes</li>
                  <li>Droit à l&apos;effacement (&quot;droit à l&apos;oubli&quot;)</li>
                  <li>Droit à la limitation du traitement</li>
                  <li>Droit à la portabilité des données</li>
                  <li>Droit d&apos;opposition au traitement</li>
                </ul>
                <p className="text-gray-700 leading-relaxed mt-4">
                  Pour exercer ces droits, contactez-nous à :
                  <a href="mailto:contact@afriquesports.net" className="text-[#022a27] hover:underline ml-1">
                    contact@afriquesports.net
                  </a>
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  7. Sécurité
                </h2>
                <p className="text-gray-700 leading-relaxed">
                  Nous mettons en œuvre des mesures de sécurité appropriées pour protéger vos données
                  contre tout accès, modification, divulgation ou destruction non autorisés.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  8. Modifications
                </h2>
                <p className="text-gray-700 leading-relaxed">
                  Nous nous réservons le droit de modifier cette politique de confidentialité à tout moment.
                  Les modifications entreront en vigueur dès leur publication sur cette page.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  9. Contact
                </h2>
                <p className="text-gray-700 leading-relaxed">
                  Pour toute question concernant cette politique de confidentialité, contactez-nous :
                </p>
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <p className="text-gray-700"><strong>Afrique Sports</strong></p>
                  <p className="text-gray-600">Dakar, Sénégal</p>
                  <p className="text-gray-600">
                    Email : <a href="mailto:contact@afriquesports.net" className="text-[#022a27] hover:underline">contact@afriquesports.net</a>
                  </p>
                  <p className="text-gray-600">
                    Téléphone : <a href="tel:+221778683200" className="text-[#022a27] hover:underline">+221 77 868 32 00</a>
                  </p>
                </div>
              </section>
            </div>
          </div>
        </article>
      </main>

      <Footer />
    </>
  );
}
