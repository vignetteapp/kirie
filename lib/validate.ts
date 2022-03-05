import { NextApiRequest } from 'next'
import { mediaType } from '@hapi/accept'

function getSupportedMimeType(options: string[], accept = ``): string {
  const mimeType = mediaType(accept, options)
  return accept.includes(mimeType) ? mimeType : ``
}

export const validateParams = (
  req: NextApiRequest,
):
  | { errorMessage: string }
  | { href: string; width?: number; quality: number; mimeType: string } => {
  const { url, w, q } = req.query
  let hrefParsed: URL
  let href: string

  if (!url) {
    return { errorMessage: `"url" parameter is required` }
  } else if (Array.isArray(url)) {
    return { errorMessage: `"url" parameter cannot be an array` }
  }

  try {
    hrefParsed = new URL(url)
    href = hrefParsed.toString()
    if (href.startsWith(`/`)) {
      href = `https://vignetteapp.org` + href
    }
  } catch (_error) {
    return { errorMessage: `"url" parameter is invalid` }
  }

  if (![`http:`, `https:`].includes(hrefParsed.protocol)) {
    return { errorMessage: `"url" parameter is invalid` }
  }

  if (Array.isArray(w)) {
    return { errorMessage: `"w" parameter (width) cannot be an array` }
  }

  if (Array.isArray(q)) {
    return { errorMessage: `"q" parameter (quality) cannot be an array` }
  }
  let quality = parseInt(q)

  if (isNaN(quality) || quality < 1 || quality > 100) {
    quality = 85
  }
  const mimeType = getSupportedMimeType(
    [`image/webp`, `image/avif`, `image/png`] || [],
    req.headers[`accept`],
  )

  const width = parseInt(w, 10)

  return {
    href,
    width,
    quality,
    mimeType,
  }
}
