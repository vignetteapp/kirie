import type { NextApiRequest, NextApiResponse } from 'next'
import { validateParams } from '../../lib/validate'
import sharp from 'sharp'
import { getExtension } from 'next/dist/server/serve-static'

const AVIF = `image/avif`
const WEBP = `image/webp`
const PNG = `image/png`
const JPEG = `image/jpeg`
const GIF = `image/gif`

export function detectContentType(buffer: Buffer) {
  if ([0xff, 0xd8, 0xff].every((b, i) => buffer[i] === b)) {
    return JPEG
  }
  if (
    [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every(
      (b, i) => buffer[i] === b,
    )
  ) {
    return PNG
  }
  if ([0x47, 0x49, 0x46, 0x38].every((b, i) => buffer[i] === b)) {
    return GIF
  }
  if (
    [0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50].every(
      (b, i) => !b || buffer[i] === b,
    )
  ) {
    return WEBP
  }

  if (
    [0, 0, 0, 0, 0x66, 0x74, 0x79, 0x70, 0x61, 0x76, 0x69, 0x66].every(
      (b, i) => !b || buffer[i] === b,
    )
  ) {
    return AVIF
  }
  return null
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  return new Promise<void>(async (resolve) => {
    const paramsResult = validateParams(req)

    if (`errorMessage` in paramsResult) {
      res.status(400).end(paramsResult.errorMessage)
      return resolve()
    }
    const { href, width, mimeType, quality } = paramsResult

    const upstreamRes = await fetch(href)

    if (!upstreamRes.ok) {
      console.error(
        `upstream image response failed for`,
        href,
        upstreamRes.status,
      )
      res
        .status(upstreamRes.status)
        .end(`"url" parameter is valid but upstream response is invalid`)
      return resolve()
    }
    const upstreamBuffer = Buffer.from(await upstreamRes.arrayBuffer())
    const upstreamType =
      detectContentType(upstreamBuffer) ||
      upstreamRes.headers.get(`Content-Type`)

    let contentType: string

    if (mimeType) {
      contentType = mimeType
    } else if (
      upstreamType?.startsWith(`image/`) &&
      getExtension(upstreamType)
    ) {
      contentType = upstreamType
    } else {
      contentType = JPEG
    }
    try {
      // Begin sharp transformation logic
      const transformer = sharp(upstreamBuffer)

      transformer.rotate()

      const { width: metaWidth } = await transformer.metadata()

      if (metaWidth && metaWidth > width) {
        transformer.resize(width)
      }

      if (contentType === AVIF) {
        if (transformer.avif) {
          const avifQuality = quality - 15
          transformer.avif({
            quality: Math.max(avifQuality, 0),
            chromaSubsampling: `4:2:0`, // same as webp
          })
        } else {
          transformer.webp({ quality })
        }
      } else if (contentType === WEBP) {
        transformer.webp({ quality })
      } else if (contentType === PNG) {
        transformer.png({ quality })
      } else if (contentType === JPEG) {
        transformer.jpeg({ quality, progressive: true, optimiseScans: true })
      }

      const optimizedBuffer = await transformer.toBuffer()
      // End sharp transformation logic
      if (optimizedBuffer) {
        res.setHeader(`cache-control`, `public,max-age=31536000,immutable`)
        res.setHeader(`content-type`, contentType)

        res.end(optimizedBuffer)
        return resolve()
      } else {
        res.status(500).end(`Unable to optimize buffer`)
        return resolve()
      }
    } catch (error) {
      if (upstreamBuffer && upstreamType) {
        // If we fail to optimize, fallback to the original image
        res.setHeader(`cache-control`, `public,max-age=31536000,immutable`)
        res.setHeader(`content-type`, upstreamType)
        res.end(upstreamBuffer)
        return resolve
      } else {
        res
          .status(500)
          .end(
            `Unable to optimize image and unable to fallback to upstream image`,
          )
        return resolve()
      }
    }
  })
}
