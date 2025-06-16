import * as cheerio from 'cheerio'
import { DataError, FetchError, type RestaurantInfo, getUserAgent, saveHtml, type MenuFile } from '../../helpers.js'
import { fetch } from 'undici'

export const info: RestaurantInfo = { id: 'pavo', name: 'Pavo', autoplayDuration: 10_000 }

export default async function scrape (): Promise<MenuFile[]> {
  const baseUrl = new URL('https://restaurangpavo.se/')
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

  const menu = $('#lunchmeny').parent().html()
  if (menu == null) throw new DataError('Could not find menu element', res.url, body)

  await saveHtml(menu, 'pavo.html')

  return [{ type: 'html', src: '/assets/pavo.html' }]
}
