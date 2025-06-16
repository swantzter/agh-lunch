import * as cheerio from 'cheerio'
import { DataError, FetchError, type RestaurantInfo, getUserAgent, saveHtml, type MenuFile } from '../../helpers.js'
import { fetch } from 'undici'

export const info: RestaurantInfo = { id: 'midgarden', name: 'Midgårdens Värdshus', autoplayDuration: 10_000 }

export default async function scrape (): Promise<MenuFile[]> {
  const baseUrl = new URL('https://www.midgarden.se/meny')
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

  const menu = $('article .content').html()
  if (menu == null) throw new DataError('Could not find menu', res.url, body)

  await saveHtml(menu, 'midgarden.html')

  return [{ type: 'html', src: '/assets/midgarden.html' }]
}
