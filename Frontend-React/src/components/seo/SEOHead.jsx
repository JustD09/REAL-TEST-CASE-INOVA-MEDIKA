import { Helmet } from 'react-helmet-async';

const SITE_URL = 'http://localhost:3000';
const SITE_NAME = 'SIMRS - Sistem Informasi Manajemen Rumah Sakit';
const DEFAULT_DESCRIPTION = 'Sistem Informasi Manajemen Rumah Sakit terintegrasi untuk pendaftaran, pemeriksaan, laboratorium, farmasi, billing, dan laporan.';

export function SEOHead({
  title,
  description = DEFAULT_DESCRIPTION,
  path = '',
  type = 'website',
  images = [],
  noIndex = false,
  noFollow = false,
  structuredData = null,
  children = null,
}) {
  const url = `${SITE_URL}${path}`;
  const image = images.length > 0 ? images[0] : `${SITE_URL}/og-default.png`;

  const jsonLd = structuredData ? [
    {
      '@context': 'https://schema.org',
      '@type': 'MedicalBusiness',
      name: 'SIMRS',
      description: DEFAULT_DESCRIPTION,
      url: SITE_URL,
      telephone: '+62-21-1234567',
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Jakarta',
        addressCountry: 'ID',
      },
      medicalSpecialty: [
        'Internal Medicine',
        'Pediatrics',
        'Surgery',
        'Obstetrics and Gynecology',
        'Laboratory Medicine',
        'Pharmacy',
      ],
      ...structuredData,
    },
  ] : null;

  return (
    <>
      <Helmet>
        <html lang="id" />
        <title>{title ? `${title} | ${SITE_NAME}` : SITE_NAME}</title>
        <meta name="description" content={description} />
        <meta name="theme-color" content="#1a1a2e" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {noIndex && <meta name="robots" content="noindex" />}
        {noFollow && <meta name="robots" content="nofollow" />}
        {noIndex && noFollow && <meta name="robots" content="noindex, nofollow" />}

        <link rel="canonical" href={url} />
        <link rel="alternate" hreflang="id" href={url} />
        <link rel="alternate" hreflang="x-default" href={url} />

        <meta property="og:type" content={type} />
        <meta property="og:url" content={url} />
        <meta property="og:title" content={title ? `${title} | ${SITE_NAME}` : SITE_NAME} />
        <meta property="og:description" content={description} />
        <meta property="og:image" content={image} />
        <meta property="og:site_name" content={SITE_NAME} />
        <meta property="og:locale" content="id_ID" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content={url} />
        <meta name="twitter:title" content={title ? `${title} | ${SITE_NAME}` : SITE_NAME} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={image} />

        {jsonLd && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
          />
        )}
      </Helmet>
      {children}
    </>
  );
}