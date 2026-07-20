const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export function validateImageFile(file, maxSizeMB = 5) {
  if (!ALLOWED_TYPES.includes(file.type)) return 'Solo se permiten imágenes JPG, PNG o WebP.'
  if (file.size > maxSizeMB * 1024 * 1024) return `La imagen no puede superar ${maxSizeMB} MB.`
  return null
}

// Downscales/re-encodes an image client-side before upload so full-resolution
// phone photos don't get stored and served as-is (course covers can go
// larger; avatars are only ever rendered at 30-70px, so a small target keeps
// them sharp without shipping megabytes for a tiny circle).
export function resizeImage(file, { maxDimension = 1280, quality = 0.82 } = {}) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      let { width, height } = img
      if (width > maxDimension || height > maxDimension) {
        const scale = maxDimension / Math.max(width, height)
        width = Math.round(width * scale)
        height = Math.round(height * scale)
      }
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      canvas.getContext('2d').drawImage(img, 0, 0, width, height)
      canvas.toBlob(
        blob => blob ? resolve(blob) : reject(new Error('No se pudo procesar la imagen.')),
        'image/jpeg',
        quality
      )
    }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('No se pudo leer la imagen.')) }
    img.src = url
  })
}
