import sharp from 'sharp'
import { writeFileSync } from 'fs'

const SRC = 'public/icons/icon.png'

const densities = [
  { dir: 'mdpi', legacy: 48, foreground: 108 },
  { dir: 'hdpi', legacy: 72, foreground: 162 },
  { dir: 'xhdpi', legacy: 96, foreground: 216 },
  { dir: 'xxhdpi', legacy: 144, foreground: 324 },
  { dir: 'xxxhdpi', legacy: 192, foreground: 432 },
]

async function main() {
  const src = sharp(SRC)
  const meta = await src.metadata()

  for (const d of densities) {
    // Legacy launcher icon (full frame)
    const legacy = await src.clone().resize(d.legacy, d.legacy).png().toBuffer()
    const base = `android/app/src/main/res/mipmap-${d.dir}`

    writeFileSync(`${base}/ic_launcher.png`, legacy)
    writeFileSync(`${base}/ic_launcher_round.png`, legacy)
    console.log(`  ${base}/ic_launcher.png ${d.legacy}x${d.legacy}`)

    // Adaptive foreground (artwork in inner 72% safe zone)
    const safeSize = Math.round(d.foreground * 0.72)
    const artwork = await src.clone().resize(safeSize, safeSize).png().toBuffer()

    const canvas = await sharp({
      create: { width: d.foreground, height: d.foreground, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } }
    })
      .composite([{
        input: artwork,
        top: Math.round((d.foreground - safeSize) / 2),
        left: Math.round((d.foreground - safeSize) / 2),
      }])
      .png()
      .toBuffer()

    writeFileSync(`${base}/ic_launcher_foreground.png`, canvas)
    console.log(`  ${base}/ic_launcher_foreground.png ${d.foreground}x${d.foreground} (safe: ${safeSize}x${safeSize})`)
  }

  console.log('Done. All Android icon variants generated.')
}

main().catch(e => { console.error(e); process.exit(1) })
