import { FetchError, type RestaurantInfo, getUserAgent, saveHtml, DataError, type MenuFile } from '../helpers'
import { fetch } from 'undici'

export const info: RestaurantInfo = { id: 'torstens', name: 'Torstens Smakar Mera', autoplayDuration: 20_000 }

export default async function scrape (): Promise<MenuFile[]> {
  const baseUrl = new URL('https://torstens.se/wp-admin/admin-ajax.php')
  const res = await fetch(baseUrl, {
    method: 'POST',
    headers: {
      accept: 'text/html',
      'cache-control': 'no-cache',
      'user-agent': getUserAgent(),
      'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
    },
    body: 'action=get_lunch&store=store1',
  })
  if (!res.ok) throw new FetchError(res.url, res.status, await res.text())

  const body = await res.text()
  if (!body) throw new DataError('Could not find menu', res.url, body)

  await saveHtml(body, 'torstens.html')

  return [{ type: 'html', src: '/assets/torstens.html' }]
}
