import * as cheerio from 'cheerio'
import { FetchError, type RestaurantInfo, getUserAgent, saveHtml, DataError, type MenuFile } from '../../helpers.js'
import { fetch } from 'undici'

export const info: RestaurantInfo = { id: 'bryggan', name: 'Bryggan Kök & Bar', autoplayDuration: 10_000 }

export default async function scrape (): Promise<MenuFile[]> {
  const baseUrl = new URL('https://brygganangelholm.se/lunch/')
  const res = await fetch(baseUrl, {
    headers: {
      accept: 'text/html',
      'cache-control': 'no-cache',
      'user-agent': getUserAgent(),
    },
  })
  if (!res.ok) throw new FetchError(res.url, res.status, await res.text())

  const body = await res.text()
  const $ = cheerio.load(body)

  const menu = $('article').html()
  if (menu == null) throw new DataError('Could not find menu', res.url, body)

  await saveHtml(menu, 'bryggan.html')

  return [{ type: 'html', src: '/assets/bryggan.html' }]
}
