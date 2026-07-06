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

  console.log('\nDone! Android icons generated from icon.ico')
}

generate().catch(err => {
  console.error(err)
  process.exit(1)
})
