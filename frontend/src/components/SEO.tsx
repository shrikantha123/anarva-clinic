import React from 'react';
import { Helmet } from 'react-helmet-async';

export interface SEOProps {
  title: string;
  description?: string;
  canonical?: string;
  type?: 'website' | 'article' | 'profile';
  image?: string;
  noIndex?: boolean;
  keywords?: string[];
  schema?: Record<string, unknown> | Array<Record<string, unknown>>;
}

const DEFAULT_METADATA = {
  siteName: 'Anarva Clinic',
  baseTitle: 'Dr. Ajith Kumar | Hair Loss, Acne & Scalp Treatment Kota, Udupi',
  defaultDescription:
    'Consult Dr. Ajith Kumar at Anarva Clinic, Kota, Udupi for certified holistic hair loss, severe acne, hives, and scalp therapies. Open Mon–Sun 10:00 AM–1:30 PM. Call +91 98765 43210.',
  siteUrl: 'https://anarvaclinic.com',
  defaultImage: 'https://anarvaclinic.com/images/anarva-clinic-share-card.jpg',
  defaultKeywords: [
    'hair loss treatment Kota',
    'dermatologist Kota Udupi',
    'Dr Ajith Kumar Anarva Clinic',
    'acne treatment Kundapura',
    'chronic hives therapy Udupi',
    'scalp psoriasis treatment Karnataka',
    'alopecia assessment',
    'trichologist near me',
  ],
};

export const SEO: React.FC<SEOProps> = ({
  title,
  description = DEFAULT_METADATA.defaultDescription,
  canonical,
  type = 'website',
  image = DEFAULT_METADATA.defaultImage,
  noIndex = false,
  keywords = DEFAULT_METADATA.defaultKeywords,
  schema,
}) => {
  const formattedTitle = title.includes('Anarva Clinic')
    ? title
    : ;

  const canonicalUrl =
    canonical ||
    (typeof window !== 'undefined'
      ? 
      : DEFAULT_METADATA.siteUrl);

  const robotsDirective = noIndex
    ? 'noindex, nofollow'
    : 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1';

  return (
    <Helmet>
      <title>{formattedTitle}</title>
      <meta name="title" content={formattedTitle} />
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords.join(', ')} />
      <meta name="robots" content={robotsDirective} />
      <link rel="canonical" href={canonicalUrl} />

      <meta name="geo.region" content="IN-KA" />
      <meta name="geo.placename" content="Kota, Udupi, Karnataka" />
      <meta name="geo.position" content="13.5186;74.7088" />
      <meta name="ICBM" content="13.5186, 74.7088" />

      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={DEFAULT_METADATA.siteName} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={formattedTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:locale" content="en_IN" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content="canonicalUrl" />
      <meta name="twitter:title" content={formattedTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {schema && (
        <script type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      )}
    </Helmet>
  );
};

export default SEO;
