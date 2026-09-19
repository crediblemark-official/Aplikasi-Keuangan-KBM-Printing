/**
 * Kompres gambar dari File ke Base64 JPEG
 * Max 800px width/height, quality 0.8
 */
export async function compressImage(
  file: File,
  maxDimension = 800,
  quality = 0.8,
): Promise<{ base64: string; filename: string; sizeKB: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')

        let { width, height } = img
        if (width > height) {
          if (width > maxDimension) {
            height = Math.round((height * maxDimension) / width)
            width = maxDimension
          }
        } else {
          if (height > maxDimension) {
            width = Math.round((width * maxDimension) / height)
            height = maxDimension
          }
        }

        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')!
        ctx.drawImage(img, 0, 0, width, height)

        const dataUrl = canvas.toDataURL('image/jpeg', quality)
        const base64 = dataUrl.split(',')[1]
        const sizeKB = Math.round((base64.length * 3) / 4 / 1024)

        const timestamp = Date.now()
        const filename = `photo_${timestamp}.jpg`

        resolve({ base64, filename, sizeKB })
      }
      img.onerror = reject
      img.src = e.target?.result as string
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
