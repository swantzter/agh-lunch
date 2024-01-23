import * as cheerio from 'cheerio'
import { FetchError, type RestaurantInfo, getUserAgent, saveHtml, DataError } from '../helpers'
import { fetch } from 'undici'

export default async function scrape (): Promise<RestaurantInfo[]> {
  const baseUrl = new URL('https://brygganangelholm.se/lunch/')
  const res = await fetch(baseUrl, {
    headers: {
      accept: 'text/html',
      'cache-control': 'no-cache',
      'user-agent': getUserAgent()
    }
  })
  if (!res.ok) throw new FetchError(res.url, res.status, await res.text())

  const body = await res.text()
  const $ = cheerio.load(body)

  const menu = $('article').html()
  if (menu == null) throw new DataError('Could not find menu', res.url, body)

  await saveHtml(menu, 'bryggan.html')

  const updatedAt = new Date()
  return [{
    id: 'bryggan',
    name: 'Bryggan Kök & Bar',
    updatedAt,
    files: [{ type: 'html', src: '/assets/bryggan.html' }]
  }]
}
