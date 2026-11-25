import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Prerender routes for SEO
const prerenderRoutes = [
  '/',
  '/login',
];

// Generate sitemap
function generateSitemap() {
  return {
    name: 'generate-sitemap',
    apply: 'build',
    generateBundle(options, bundle) {
      const baseUrl = 'http://localhost:3000';
      const routes = [
        { path: '/', changefreq: 'daily', priority: 1.0 },
        { path: '/dashboard', changefreq: 'daily', priority: 0.9 },
        { path: '/pendaftaran', changefreq: 'weekly', priority: 0.8 },
        { path: '/antrean', changefreq: 'daily', priority: 0.8 },
        { path: '/pemeriksaan', changefreq: 'weekly', priority: 0.7 },
        { path: '/laboratorium', changefreq: 'weekly', priority: 0.7 },
        { path: '/farmasi', changefreq: 'weekly', priority: 0.7 },
        { path: '/billing', changefreq: 'weekly', priority: 0.7 },
        { path: '/laporan', changefreq: 'weekly', priority: 0.6 },
        { path: '/pengaturan', changefreq: 'monthly', priority: 0.5 },
        { path: '/login', changefreq: 'yearly', priority: 0.3 },
      ];

      const today = new Date().toISOString().split('T')[0];
      const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes.map(route => `  <url>
    <loc>${baseUrl}${route.path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

      this.emitFile({
        type: 'asset',
        fileName: 'sitemap.xml',
        source: sitemap,
      });

      // Generate robots.txt
      const robots = `User-agent: *
Allow: /

Sitemap: ${baseUrl}/sitemap.xml
`;

      this.emitFile({
        type: 'asset',
        fileName: 'robots.txt',
        source: robots,
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), generateSitemap()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 3000,
    host: true,
    proxy: {
      '/api': {
        target: 'https://localhost',
        changeOrigin: true,
        secure: false,
      },
      '/node-api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          mui: ['@mui/material', '@mui/icons-material', '@emotion/react', '@emotion/styled'],
          charts: ['@mui/x-data-grid', '@mui/x-date-pickers'],
          utils: ['axios', 'zustand', 'dayjs', 'yup'],
        },
      },
    },
  },
});