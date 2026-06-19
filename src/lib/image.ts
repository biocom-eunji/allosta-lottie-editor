import type { ImageValue } from '../lottie/controls'

/** File -> base64 data URI + 크기 측정 */
export function fileToImageValue(file: File): Promise<ImageValue> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const dataUri = reader.result as string
      const img = new Image()
      img.onload = () => resolve({ dataUri, w: img.naturalWidth, h: img.naturalHeight })
      img.onerror = reject
      img.src = dataUri
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
