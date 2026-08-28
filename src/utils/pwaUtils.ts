import { LibraryStore } from './storage';

const DEFAULT_ICON_URL = '/icon.svg';
let currentManifestBlobUrl: string | null = null;

export interface AppManifestConfig {
  name: string;
  shortName: string;
  description: string;
  themeColor: string;
  backgroundColor: string;
  iconUrl: string;
}

/**
 * Generates and applies a dynamic Web App Manifest and favicon/apple-touch-icon links in document head.
 */
export function applyDynamicAppManifest(customIconUrl?: string, appName?: string): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  const school = LibraryStore.getSchoolProfile();
  const savedIcon = customIconUrl || LibraryStore.getAppIcon() || school.logoUrl || DEFAULT_ICON_URL;
  const resolvedName = appName || school.schoolName || 'Lumina Library PRO';
  const resolvedShortName = resolvedName.length > 12 ? resolvedName.slice(0, 12) : resolvedName;

  // 1. Update favicon
  let faviconLink = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
  if (!faviconLink) {
    faviconLink = document.createElement('link');
    faviconLink.rel = 'icon';
    document.head.appendChild(faviconLink);
  }
  faviconLink.href = savedIcon;

  // 2. Update apple-touch-icon
  let appleTouchLink = document.querySelector<HTMLLinkElement>("link[rel='apple-touch-icon']");
  if (!appleTouchLink) {
    appleTouchLink = document.createElement('link');
    appleTouchLink.rel = 'apple-touch-icon';
    document.head.appendChild(appleTouchLink);
  }
  appleTouchLink.href = savedIcon;

  // 3. Construct dynamic manifest object
  const manifestData = {
    name: resolvedName,
    short_name: resolvedShortName,
    description: `Sistem Manajemen Perpustakaan Sekolah Digital - ${resolvedName}`,
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait-primary',
    background_color: '#020617',
    theme_color: '#10b981',
    icons: [
      {
        src: savedIcon,
        sizes: '192x192 512x512 any',
        type: savedIcon.startsWith('data:image/svg') ? 'image/svg+xml' : 'image/png',
        purpose: 'any maskable'
      },
      {
        src: savedIcon,
        sizes: '512x512',
        type: savedIcon.startsWith('data:image/svg') ? 'image/svg+xml' : 'image/png',
        purpose: 'any'
      }
    ],
    categories: ['education', 'utilities', 'productivity']
  };

  // Revoke old blob url to avoid memory leaks
  if (currentManifestBlobUrl) {
    URL.revokeObjectURL(currentManifestBlobUrl);
  }

  const blob = new Blob([JSON.stringify(manifestData, null, 2)], { type: 'application/manifest+json' });
  currentManifestBlobUrl = URL.createObjectURL(blob);

  // 4. Update or inject manifest link in head
  let manifestLink = document.querySelector<HTMLLinkElement>("link[rel='manifest']");
  if (!manifestLink) {
    manifestLink = document.createElement('link');
    manifestLink.rel = 'manifest';
    document.head.appendChild(manifestLink);
  }
  manifestLink.href = currentManifestBlobUrl;

  console.log('[Lumina PWA] Dynamic manifest & app icons applied:', { name: resolvedName, icon: savedIcon.substring(0, 30) + '...' });
}

/**
 * Validates and compresses an uploaded icon image (PNG/SVG) to optimal PWA resolution
 */
export async function processUploadedAppIcon(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    // 1. Validation
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      return reject(new Error('Format berkas tidak didukung. Harap unggah format PNG, SVG, JPG, atau WEBP.'));
    }

    if (file.size > 4 * 1024 * 1024) {
      return reject(new Error('Ukuran berkas melebihi 4MB. Harap gunakan gambar yang lebih kecil.'));
    }

    // If SVG, read as text / data URL directly
    if (file.type === 'image/svg+xml') {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        resolve(result);
      };
      reader.onerror = () => reject(new Error('Gagal membaca berkas SVG.'));
      reader.readAsDataURL(file);
      return;
    }

    // For PNG/JPG, compress into a crisp 512x512 square canvas
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const size = 512;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return resolve(e.target?.result as string);
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Draw image centered in square
        ctx.clearRect(0, 0, size, size);
        ctx.drawImage(img, 0, 0, size, size);

        const compressedDataUrl = canvas.toDataURL('image/png', 0.95);
        resolve(compressedDataUrl);
      };
      img.onerror = () => reject(new Error('Gagal memproses gambar ikon.'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Gagal membaca berkas gambar.'));
    reader.readAsDataURL(file);
  });
}
