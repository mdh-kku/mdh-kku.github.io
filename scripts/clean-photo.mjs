// Removes hidden metadata (including GPS location) from photos before they go into the public repository.
// Usage: node scripts/clean-photo.mjs path/to/photo.jpg [more photos...]
import { renameSync } from 'node:fs';
import sharp from 'sharp';

for (const file of process.argv.slice(2)) {
  const tmp = file.replace(/(\.[^.\\/]+)$/, '.clean$1');
  // rotate() bakes in the phone's orientation; sharp writes no metadata unless asked to.
  await sharp(file).rotate().toFile(tmp);
  renameSync(tmp, file);
  console.log(`cleaned ${file}`);
}
