import type { NextApiRequest, NextApiResponse } from 'next'
import sharp from 'sharp'
import https from 'https'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  return new Promise<void>((resolve) => {
    try {
      const quality = req.query[`q`]
      const format = `webp`

      const pipeline = sharp()
        .toFormat(format, {
          quality: parseInt((quality as string) || `85`),
          progressive: true,
          optimiseScans: true,
        })
        .toBuffer((e, o) => {
          res.setHeader(`cache-control`, `public,max-age=31536000,immutable`)
          res.setHeader(`content-type`, `image/${format}`)

          res.write(o)
          res.end()
          return resolve()
        })

      return https.get(req.query.url as string, (res) => res.pipe(pipeline))
    } catch (e) {
      console.error(e)
      return res.status(500).end()
    }
  })
}
