import { DataError, FetchError, getUserAgent, MenuFile, saveHtml, type RestaurantInfo } from '../../helpers.js'
import * as cheerio from 'cheerio'
import { fetch } from 'undici'

export const info: RestaurantInfo = { id: 'tiramisu', name: 'Tiramisu', autoplayDuration: 10_000 }

export default async function scrape (): Promise<MenuFile[]> {
  const baseUrl = new URL('https://tiramisuu.se/')
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

  const menu = $('.et_pb_section_1').html()
  if (menu == null) throw new DataError('Could not find menu element', res.url, body)

  await saveHtml(menu, 'tiramisu.html')

  return [{ type: 'html', src: '/assets/tiramisu.html' }]
}
