
export async function handleRequest(request: Request): Promise<Response> {
  const supports: string[] = []
  const accept = request.headers.get(`accept`)
  const newUrl = new URL(request.url)

  accept?.includes('webp') && supports.push("webp")

  accept?.includes('avif') && supports.push("avif")
  newUrl.searchParams.append('imageSupport', supports.join('-'))

  if (newUrl.searchParams.get('url')?.startsWith('/_next')) {
    newUrl.hostname = "vignette.vercel.app"
    newUrl.pathname = newUrl.searchParams.get('url') as string
  } else {
    newUrl.hostname = "kirie.vercel.app"
    newUrl.pathname = "/"
  }
  console.log(newUrl.toString())

  const cache = caches.default;
  const newRequest = new Request(newUrl.toString(), request)

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
