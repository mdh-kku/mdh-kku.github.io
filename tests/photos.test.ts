import { describe, it, expect } from 'vitest';
import { execSync } from 'node:child_process';
import { mkdtempSync, readdirSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import sharp from 'sharp';

const walk = (d: string): string[] =>
  readdirSync(d).flatMap((f) => (statSync(join(d, f)).isDirectory() ? walk(join(d, f)) : [join(d, f)]));

describe('photos in the public repository', () => {
  it('carry no EXIF metadata (phone photos hide GPS location there)', async () => {
    const photos = walk('src/content').filter((f) => /\.(jpe?g|png|webp|avif|tiff?)$/i.test(f));
    for (const f of photos) expect((await sharp(f).metadata()).exif, f).toBeUndefined();
  });

  it('scripts/clean-photo.mjs strips that metadata', async () => {
    const file = join(mkdtempSync(join(tmpdir(), 'mdh-photo-')), 'phone.jpg');
    await sharp({ create: { width: 16, height: 8, channels: 3, background: '#888' } })
      .withMetadata({ exif: { IFD0: { Copyright: 'test' } } })
      .jpeg()
      .toFile(file);
    expect((await sharp(file).metadata()).exif).toBeDefined();
    execSync(`node scripts/clean-photo.mjs "${file}"`);
    expect((await sharp(file).metadata()).exif).toBeUndefined();
  });
});
