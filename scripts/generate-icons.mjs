import sharp from 'sharp'
import { mkdir } from 'fs/promises'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const SVG_PATH = join(ROOT, 'assets', 'icon.svg')

async function ensureDir(dir) {
  await mkdir(dir, { recursive: true })
}

async function generate() {
  const svgBuffer = await sharp(SVG_PATH).toBuffer()

  // Android icons (mipmap)
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

    // Standard launcher icon
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(join(dir, 'ic_launcher.png'))

    // Round launcher icon
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(join(dir, 'ic_launcher_round.png'))

    // Foreground (for adaptive icon)
    const fgSize = size * 4.5
    await sharp(svgBuffer)
      .resize(Math.round(fgSize), Math.round(fgSize))
      .png()
      .toFile(join(dir, 'ic_launcher_foreground.png'))

    console.log(`  Android ${density}: ${size}px`)
  }

  // Windows .ico (multiple sizes)
  const icoSizes = [16, 24, 32, 48, 64, 128, 256]
  const icoBuffers = await Promise.all(
    icoSizes.map(async (size) => {
      const buf = await sharp(svgBuffer).resize(size, size).png().toBuffer()
      return { size, buffer: buf }
    })
  )

  // Build ICO file manually (simple format)
  const icoDirEntries = []
  const imageBuffers = []
  let offset = 6 + (icoSizes.length * 16) // header + directory entries

  for (const { size, buffer } of icoBuffers) {
    icoDirEntries.push({
      width: size >= 256 ? 0 : size,
      height: size >= 256 ? 0 : size,
      size: buffer.length,
      offset,
    })
    imageBuffers.push(buffer)
    offset += buffer.length
  }

  // ICO header
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0)     // reserved
  header.writeUInt16LE(1, 2)     // type: 1 = ICO
  header.writeUInt16LE(icoSizes.length, 4) // count

  // Directory entries
  const dirBuf = Buffer.alloc(icoSizes.length * 16)
  icoDirEntries.forEach((entry, i) => {
    const base = i * 16
    dirBuf.writeUInt8(entry.width, base)
    dirBuf.writeUInt8(entry.height, base + 1)
    dirBuf.writeUInt8(0, base + 2)   // color palette
    dirBuf.writeUInt8(0, base + 3)   // reserved
    dirBuf.writeUInt16LE(1, base + 4) // color planes
    dirBuf.writeUInt16LE(32, base + 6) // bits per pixel
    dirBuf.writeUInt32LE(entry.size, base + 8) // image size
    dirBuf.writeUInt32LE(entry.offset, base + 12) // image offset
  })

  const icoPath = join(ROOT, 'assets', 'icon.ico')
  await sharp(svgBuffer).toFile(icoPath.replace('.ico', '-temp.png'))
  // Write the actual ICO
  const { writeFileSync } = await import('fs')
  writeFileSync(icoPath, Buffer.concat([header, dirBuf, ...imageBuffers]))
  console.log(`  Windows icon.ico: ${icoSizes.join(', ')}px`)

  console.log('\nDone! Icons generated in assets/')
}

generate().catch(err => {
  console.error(err)
  process.exit(1)
})
