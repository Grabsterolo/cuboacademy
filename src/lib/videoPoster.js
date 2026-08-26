/**
 * Saca el primer fotograma de un vídeo y lo devuelve como WebP.
 *
 * El póster es lo que evita que la portada aparezca en negro mientras el vídeo
 * se descarga. Pedírselo al admin como un archivo aparte sería una tercera
 * subida que se le puede olvidar, y entonces el problema vuelve: se genera
 * aquí, del propio archivo que acaba de elegir.
 *
 * Se busca el segundo 0.1 y no el 0: en muchos vídeos el fotograma inicial
 * viene de un fundido y sale casi negro, que es justo lo que se quiere evitar.
 */
export function posterFromVideo(file, { maxWidth = 1280, quality = 0.72 } = {}) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const video = document.createElement('video')
    video.preload = 'auto'
    video.muted = true
    video.playsInline = true
    video.src = url

    const fail = msg => { URL.revokeObjectURL(url); reject(new Error(msg)) }
    const timer = setTimeout(() => fail('El vídeo tardó demasiado en abrirse.'), 15000)

    video.onerror = () => { clearTimeout(timer); fail('No se pudo leer el vídeo.') }

    video.onloadeddata = () => {
      // Un salto mínimo fuerza a decodificar un fotograma real.
      video.currentTime = Math.min(0.1, (video.duration || 1) / 2)
    }

    video.onseeked = () => {
      clearTimeout(timer)
      try {
        const scale = Math.min(1, maxWidth / video.videoWidth)
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(video.videoWidth * scale)
        canvas.height = Math.round(video.videoHeight * scale)
        canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height)
        canvas.toBlob(blob => {
          URL.revokeObjectURL(url)
          if (blob) resolve(blob)
          else reject(new Error('No se pudo generar la imagen de respaldo.'))
        }, 'image/webp', quality)
      } catch (err) {
        URL.revokeObjectURL(url)
        reject(err)
      }
    }
  })
}
