const sharp = require('sharp')
const fs = require('fs')
const path = require('path')

const sizes = [72, 96, 128, 144, 152, 192, 384, 512]

// Create a simple CompliSite icon (blue square with white "C")
const svgIcon = `
<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" fill="#0070f3" rx="64"/>
  <text x="256" y="360" font-family="Arial" font-size="320" font-weight="bold" 
        text-anchor="middle" fill="white">C</text>
</svg>
`

async function generateIcons() {
  const publicDir = path.join(__dirname, '../public')
  
  for (const size of sizes) {
    await sharp(Buffer.from(svgIcon))
      .resize(size, size)
      .png()
      .toFile(path.join(publicDir, `icon-${size}x${size}.png`))
    
    console.log(`Generated icon-${size}x${size}.png`)
  }
}

generateIcons().catch(console.error)
