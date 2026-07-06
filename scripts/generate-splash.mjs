import sharp from 'sharp'
import { writeFileSync } from 'fs'

const sizes = {
  'mdpi': 320,
  'hdpi': 480,
  'xhdpi': 720,
  'xxhdpi': 960,
  'xxxhdpi': 1280,
}

async function generate() {
  for (const [density, w] of Object.entries(sizes)) {
    const h = Math.round(w * 0.375)
    const fontSize = Math.round(w * 0.12)
    const svg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
  <text x="${w/2}" y="${h/2}" text-anchor="middle" dominant-baseline="central"
        fill="white" font-size="${fontSize}" font-weight="bold"
        font-family="Malgun Gothic, Apple SD Gothic Neo, Nanum Gothic, sans-serif">한글 Hangul Learn</text>
</svg>`
    const img = await sharp({
      create: { width: w, height: h, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } }
    }).composite([{ input: Buffer.from(svg), top: 0, left: 0 }]).png().toBuffer()
    writeFileSync(`android/app/src/main/res/drawable-${density}/splash_text.png`, img)
    console.log(`Generated splash_text.png for ${density} (${w}x${h})`)
  }

  // Also a base copy in drawable/ for fallback
  const baseW = 720, baseH = Math.round(720 * 0.375)
  const baseFont = Math.round(720 * 0.12)
  const svg = `<svg width="${baseW}" height="${baseH}" xmlns="http://www.w3.org/2000/svg">
  <text x="${baseW/2}" y="${baseH/2}" text-anchor="middle" dominant-baseline="central"
        fill="white" font-size="${baseFont}" font-weight="bold"
        font-family="Malgun Gothic, Apple SD Gothic Neo, Nanum Gothic, sans-serif">한글 Hangul Learn</text>
</svg>`
  const img = await sharp({
    create: { width: baseW, height: baseH, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } }
  }).composite([{ input: Buffer.from(svg), top: 0, left: 0 }]).png().toBuffer()
  writeFileSync('android/app/src/main/res/drawable/splash_text.png', img)
  console.log(`Generated splash_text.png for drawable/ (${baseW}x${baseH})`)

  console.log('Done!')
}

generate().catch(e => console.error(e))
