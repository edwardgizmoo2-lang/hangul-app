import sharp from 'sharp'
import { writeFileSync, mkdirSync } from 'fs'

const sizes = {
  'mdpi': { port: 320, land: 180 },
  'hdpi': { port: 480, land: 270 },
  'xhdpi': { port: 720, land: 405 },
  'xxhdpi': { port: 960, land: 540 },
  'xxxhdpi': { port: 1280, land: 720 },
}

function makeSvg(w, h, fontSize) {
  return `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${w}" height="${h}" fill="#121214"/>
  <text x="${w/2}" y="${h/2}" text-anchor="middle" dominant-baseline="central"
        fill="white" font-size="${fontSize}" font-weight="bold"
        font-family="Malgun Gothic, Apple SD Gothic Neo, Nanum Gothic, sans-serif">한글Learn</text>
</svg>`
}

async function generate() {
  // Base drawable (default fallback)
  const baseW = 640, baseH = 640
  const baseSvg = makeSvg(baseW, baseH, 64)
  const baseImg = await sharp({
    create: { width: baseW, height: baseH, channels: 3, background: { r: 18, g: 18, b: 20 } }
  }).composite([{ input: Buffer.from(baseSvg), top: 0, left: 0 }]).png().toBuffer()
  writeFileSync('android/app/src/main/res/drawable/splash.png', baseImg)
  console.log(`Generated splash.png for drawable/ (${baseW}x${baseH})`)

  for (const [density, dims] of Object.entries(sizes)) {
    for (const orient of ['port', 'land']) {
      const w = orient === 'port' ? dims.port : dims.port
      const h = orient === 'port' ? dims.port : dims.land
      const fontSize = Math.round(w * 0.1)
      const svg = makeSvg(w, h, fontSize)

      const dir = `android/app/src/main/res/drawable-${orient}-${density}`
      mkdirSync(dir, { recursive: true })

      const img = await sharp({
        create: { width: w, height: h, channels: 3, background: { r: 18, g: 18, b: 20 } }
      })
        .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
        .png()
        .toBuffer()

      writeFileSync(`${dir}/splash.png`, img)
      console.log(`Generated splash.png for ${orient}-${density} (${w}x${h}, font=${fontSize})`)
    }
  }
  console.log('Done!')
}

generate().catch(e => console.error(e))
