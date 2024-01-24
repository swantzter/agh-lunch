import { FetchError, type RestaurantInfo, getUserAgent, saveHtml, DataError } from '../helpers'
import { fetch } from 'undici'

export default async function scrape (): Promise<RestaurantInfo[]> {
  const baseUrl = new URL('https://torstens.se/wp-admin/admin-ajax.php')
  const res = await fetch(baseUrl, {
    method: 'POST',
    headers: {
      accept: 'text/html',
      'cache-control': 'no-cache',
      'user-agent': getUserAgent(),
      'content-type': 'application/x-www-form-urlencoded; charset=UTF-8'
    },
    body: 'action=get_lunch&store=store1'
  })
  if (!res.ok) throw new FetchError(res.url, res.status, await res.text())

  const body = await res.text()
  if (body == null) throw new DataError('Could not find menu', res.url, body)

  await saveHtml(body, 'torstens.html')

  const updatedAt = new Date()
  return [{
    id: 'torstens',
    name: 'Torstens Smakar Mera',
    updatedAt,
    files: [{ type: 'html', src: '/assets/torstens.html' }]
  }]
}
