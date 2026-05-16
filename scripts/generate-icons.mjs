#!/usr/bin/env node
/**
 * generate-icons.mjs — rasterise public/icon.svg to the PNG sizes the
 * web manifest + iOS Safari "Add to Home Screen" pipeline expects.
 *
 * Run on-demand:   node scripts/generate-icons.mjs
 * Idempotent: rewrites the same PNGs every run.
 */
import sharp from 'sharp';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const svg = readFileSync(resolve(root, 'public/icon.svg'));

const targets = [
  { out: 'public/icon-192.png',          size: 192, pad: 0    },
  { out: 'public/icon-512.png',          size: 512, pad: 0    },
  { out: 'public/icon-maskable-512.png', size: 512, pad: 0.1  }, // 10% safe-zone padding
  { out: 'public/apple-touch-icon.png',  size: 180, pad: 0    }
];

for (const { out, size, pad } of targets) {
  const inner = Math.round(size * (1 - pad * 2));
  const offset = Math.round(size * pad);
  const png = await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 8, g: 9, b: 13, alpha: 1 }
    }
  })
    .composite([{ input: await sharp(svg).resize(inner, inner).png().toBuffer(), top: offset, left: offset }])
    .png()
    .toBuffer();
  const outPath = resolve(root, out);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, png);
  console.log(`✓ ${out} (${size}×${size})`);
}
