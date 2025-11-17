import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Cloudive • Dexpesas',
    short_name: 'Dexpesas',
    description: 'Cloudive: tecnologia leve, modular e acessível guiando sua jornada financeira.',
    start_url: '/',
    display: 'standalone',
    background_color: '#020617',
    theme_color: '#3B82F6',
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      {
        src: '/logo-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/logo-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
