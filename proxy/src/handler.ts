
export async function handleRequest(request: Request): Promise<Response> {
  const supports: string[] = []
  const accept = request.headers.get(`accept`)
  let newUrl = new URL(request.url)

  accept?.includes('webp') && supports.push("webp")

  accept?.includes('avif') && supports.push("avif")
  newUrl.searchParams.append('imageSupport', supports.join('-'))

  if (newUrl.pathname.startsWith('/_next/image')) {
    newUrl.hostname = "vignette.vercel.app"
  } else {
    newUrl.hostname = "kirie.vercel.app"
    newUrl = new URL(newUrl.href)
    newUrl.pathname= "/" +newUrl.search
  }

  const cache = caches.default;
  const newRequest = new Request(newUrl.toString(), request)
  newRequest.headers.set('accept', request.headers.get('accept') as string)

  const data = await cache.match(newRequest);

  if (data) {
    return data

  } else {
    const res = await fetch(newRequest)
    if (res.status == 200) {
      await cache.put(newRequest, res.clone())
    }
    return res
  }
}
