import * as cheerio from 'cheerio'
import { DataError, FetchError, getUserAgent, saveHtml, type RestaurantInfo, type MenuFile } from '../../helpers.js'

export const info: RestaurantInfo = { id: 'vaktkuren', name: 'Vaktkurens Mos', autoplayDuration: 10_000 }

export default async function scrape (): Promise<MenuFile[]> {
  const baseUrl = 'http://www.vaktkuren.se/meny.asp'
  const res = await fetch(baseUrl, {
    headers: {
      accept: 'text/html',
      'cache-control': 'no-cache',
      'user-agent': getUserAgent(),
    },
  })
  if (!res.ok) throw new FetchError(res.url, res.status, await res.text())

  const body = await res.arrayBuffer()
  const bodyText = new TextDecoder('windows-1252').decode(body)
  const $ = cheerio.load(bodyText)

  const menu = $('#print_content').html()
  if (menu == null) throw new DataError('Could not find menu', res.url, body)

  await saveHtml(menu, 'vaktkuren.html')

  return [{
    type: 'html',
    src: '/assets/vaktkuren.html',
  }]
}
