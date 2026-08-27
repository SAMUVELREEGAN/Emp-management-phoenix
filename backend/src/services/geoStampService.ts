import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

export interface GeoStampMeta {
  address?: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  capturedAt: string;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export async function stampGeoLocationOnImage(
  sourcePath: string,
  outputPath: string,
  meta: GeoStampMeta,
): Promise<void> {
  const image = sharp(sourcePath);
  const metadata = await image.metadata();
  const width = metadata.width || 1080;
  const height = metadata.height || 1920;
  const barHeight = Math.max(148, Math.round(height * 0.17));
  const capturedLabel = new Date(meta.capturedAt).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const lines = [
    meta.address?.trim() || 'Current location',
    `${meta.latitude.toFixed(6)}, ${meta.longitude.toFixed(6)}`,
    meta.accuracy != null
      ? `GPS accuracy: ±${Math.round(meta.accuracy)} meters`
      : 'GPS location captured',
    capturedLabel,
  ];

  const textElements = lines
    .map((line, index) => {
      const y = 38 + index * 26;
      const attrs =
        index === 0
          ? 'font-size="17" font-weight="bold"'
          : 'font-size="14"';
      return `<text x="18" y="${y}" fill="#FFFFFF" font-family="Arial, sans-serif" ${attrs}>${escapeXml(line)}</text>`;
    })
    .join('\n');

  const overlaySvg = Buffer.from(`
    <svg width="${width}" height="${barHeight}">
      <rect width="100%" height="100%" fill="rgba(0,0,0,0.84)"/>
      <text x="18" y="22" fill="#FFC107" font-family="Arial, sans-serif" font-size="13" font-weight="bold">GEO CAM • FIELD HOURLY REPORT</text>
      ${textElements}
    </svg>
  `);

  await image
    .extend({
      bottom: barHeight,
      background: '#111111',
    })
    .composite([{ input: overlaySvg, top: height, left: 0 }])
    .jpeg({ quality: 88 })
    .toFile(outputPath);

  if (path.resolve(sourcePath) !== path.resolve(outputPath) && fs.existsSync(sourcePath)) {
    fs.unlinkSync(sourcePath);
  }
}
