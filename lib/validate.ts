import { NextApiRequest } from 'next'
import { mediaType } from '@hapi/accept'

const domains = [
  `yuri.might-be-super.fun`,
  `avatars.githubusercontent.com`,
  `vignetteapp.org`,
  `res.cloudinary.com`,
  `user-images.githubusercontent.com`,
]

function getSupportedMimeType(options: string[], accept = ``): string {
  const mimeType = mediaType(accept, options)
  return accept.includes(mimeType) ? mimeType : ``
}

export const validateParams = (
  req: NextApiRequest,
):
  | { errorMessage: string }
  | { href: string; width: number; quality: number; mimeType: string } => {
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
  } catch (_error) {
    return { errorMessage: `"url" parameter is invalid` }
  }

  if (![`http:`, `https:`].includes(hrefParsed.protocol)) {
    return { errorMessage: `"url" parameter is invalid` }
  }
  if (!domains || !domains.includes(hrefParsed.hostname)) {
    return { errorMessage: `"url" parameter is not allowed` }
  }

  if (Array.isArray(w)) {
    return { errorMessage: `"w" parameter (width) cannot be an array` }
  }

  if (Array.isArray(q)) {
    return { errorMessage: `"q" parameter (quality) cannot be an array` }
  }
  const quality = parseInt(q)

  if (isNaN(quality) || quality < 1 || quality > 100) {
    return {
      errorMessage: `"q" parameter (quality) must be a number between 1 and 100`,
    }
  }
  const mimeType = getSupportedMimeType(
    [`image/webp`, `image/avif`] || [],
    req.headers[`accept`],
  )

  const width = parseInt(w, 10)

  if (!width || isNaN(width)) {
    return {
      errorMessage: `"w" parameter (width) must be a number greater than 0`,
    }
  }

  return {
    href,
    width,
    quality,
    mimeType,
  }
}
