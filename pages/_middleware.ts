import type { NextRequest } from 'next/server'

export default async function middleware(req: NextRequest) {
  const imageUrl = req.nextUrl.searchParams.get('url')
  const quality = req.nextUrl.searchParams.get('q')
  const width = req.nextUrl.searchParams.get('w')


  const url = new URL(`https://${process.env.PRODUCTION ? req.nextUrl.host : "vignette-web-vignette.vercel.app"}/_next/image`)

  url.searchParams.set('url',imageUrl)
  url.searchParams.set('q',quality)
  url.searchParams.set('w',width)

  const res = await fetch(url.toString(),{headers:{accept:req.headers.get('accept')}})
  
  return res
}
