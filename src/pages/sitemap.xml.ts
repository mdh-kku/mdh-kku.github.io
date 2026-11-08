import type { APIRoute } from 'astro';

const PAGES = ['/', '/people/'];

export const GET: APIRoute = ({ site }) => {
  const urls = PAGES.map((path) => `<url><loc>${new URL(path, site)}</loc></url>`).join('');
  const xml = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml' } });
};
