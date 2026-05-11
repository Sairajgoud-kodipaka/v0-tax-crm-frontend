import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/login', '/signup'],
        disallow: ['/admin/', '/employee/', '/client/', '/supabase-demo/'],
      },
    ],
    sitemap: 'https://www.taxfiley.com/sitemap.xml',
    host: 'https://www.taxfiley.com',
  };
}
