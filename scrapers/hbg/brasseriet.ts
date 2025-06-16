import * as cheerio from 'cheerio'
import { DataError, FetchError, getUserAgent, MenuFile, saveHtml, type RestaurantInfo } from '../../helpers.js'
import { fetch } from 'undici'

export const info: RestaurantInfo = { id: 'brasseriet', name: 'Brasseriet' }

export default async function scrape (): Promise<MenuFile[]> {
  const baseUrl = 'https://www.brasseriethelsingborg.se/lunch'
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

  const menu = $('main [data-testid="richTextElement"]').html()
  if (menu == null) throw new DataError('Could not find menu', res.url, body)

  await saveHtml(menu, `${info.id}.html`)

  return [{
    type: 'html',
    src: `/assets/${info.id}.html`,
  }]
}
