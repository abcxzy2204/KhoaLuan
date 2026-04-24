/**
 * Gọi API an toàn: tránh lỗi "Unexpected end of JSON input" khi backend không trả JSON.
 * Thử qua proxy (Vite) trước, sau đó thử trực tiếp backend nếu cần.
 */
const BACKEND_URL = 'http://localhost:5000'

export async function fetchProducts(limit = null, sortBy = null) {
  let path = '/api/products?'
  if (limit) path += `limit=${limit}&`
  if (sortBy) path += `sortBy=${sortBy}&`
  path = path.replace(/[?&]$/, '')
  const urls = [path, `${BACKEND_URL}${path}`]

  for (const url of urls) {
    try {
      const res = await fetch(url)
      const text = await res.text()
      if (!text) continue
      const data = JSON.parse(text)
      const list = data.data ?? data
      if (Array.isArray(list)) return list
    } catch (_) {
      continue
    }
  }
  return []
}
