import sharp from 'sharp'
import { mkdir } from 'fs/promises'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const ICO_PATH = join(ROOT, 'assets', 'icon.ico')

function extractPngFromIco(icoPath) {
  const buf = readFileSync(icoPath)
  const count = buf.readUInt16LE(4)

  let bestOffset = 0
  let bestSize = 0

  for (let i = 0; i < count; i++) {
    const entryOffset = 6 + i * 16
    const size = buf.readUInt32LE(entryOffset + 8)
    const offset = buf.readUInt32LE(entryOffset + 12)
    if (size > bestSize) {
      bestSize = size
      bestOffset = offset
    }
  }

  return buf.slice(bestOffset, bestOffset + bestSize)
}

async function ensureDir(dir) {
  await mkdir(dir, { recursive: true })
}

async function generate() {
  const pngBuffer = extractPngFromIco(ICO_PATH)

  const androidSizes = {
    'mdpi': 48,
    'hdpi': 72,
    'xhdpi': 96,
    'xxhdpi': 144,
    'xxxhdpi': 192,
  }

  for (const [density, size] of Object.entries(androidSizes)) {
    const dir = join(ROOT, 'android', 'app', 'src', 'main', 'res', `mipmap-${density}`)
    await ensureDir(dir)

    await sharp(pngBuffer).resize(size, size).png().toFile(join(dir, 'ic_launcher.png'))
    await sharp(pngBuffer).resize(size, size).png().toFile(join(dir, 'ic_launcher_round.png'))

    const fgSize = size * 4.5
    await sharp(pngBuffer).resize(Math.round(fgSize), Math.round(fgSize)).png().toFile(join(dir, 'ic_launcher_foreground.png'))

    console.log(`  Android ${density}: ${size}px`)
  }

  // Generate splash screen images (centered icon on dark background)
  const splashSizes = {
    'mdpi': 320,
    'hdpi': 480,
    'xhdpi': 640,
    'xxhdpi': 960,
    'xxxhdpi': 1280,
  }

  for (const [density, size] of Object.entries(splashSizes)) {
    const dir = join(ROOT, 'android', 'app', 'src', 'main', 'res', `drawable-port-${density}`)
    await ensureDir(dir)
    const landDir = join(ROOT, 'android', 'app', 'src', 'main', 'res', `drawable-land-${density}`)
    await ensureDir(landDir)

    const iconSize = Math.round(size * 0.25)
    const resizedIcon = await sharp(pngBuffer).resize(iconSize, iconSize).toBuffer()

    await sharp({
      create: { width: size, height: size, channels: 4, background: { r: 18, g: 18, b: 20, alpha: 1 } }
    }).composite([{ input: resizedIcon, top: Math.round((size - iconSize) / 2), left: Math.round((size - iconSize) / 2) }])
      .png().toFile(join(dir, 'splash.png'))

    const landHeight = Math.round(size * 0.5625)
    await sharp({
      create: { width: size, height: landHeight, channels: 4, background: { r: 18, g: 18, b: 20, alpha: 1 } }
    }).composite([{ input: resizedIcon, top: Math.round((landHeight - iconSize) / 2), left: Math.round((size - iconSize) / 2) }])
      .png().toFile(join(landDir, 'splash.png'))

    console.log(`  Splash ${density}: ${size}px`)
  }

  // Default drawable splash
  const defaultDir = join(ROOT, 'android', 'app', 'src', 'main', 'res', 'drawable')
  await ensureDir(defaultDir)
  const defaultIcon = await sharp(pngBuffer).resize(160, 160).toBuffer()
  await sharp({
    create: { width: 640, height: 640, channels: 4, background: { r: 18, g: 18, b: 20, alpha: 1 } }
  }).composite([{ input: defaultIcon, top: 240, left: 240 }])
    .png().toFile(join(defaultDir, 'splash.png'))

  console.log('  Splash default: 640px')

  console.log('\nDone! Android icons and splash screens generated from icon.ico')
}

generate().catch(err => {
  console.error(err)
  process.exit(1)
})
