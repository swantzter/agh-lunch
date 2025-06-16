import * as cheerio from 'cheerio'
import { DataError, FetchError, getUserAgent, MenuFile, saveHtml, type RestaurantInfo } from '../../helpers.js'
import { fetch } from 'undici'

export const info: RestaurantInfo = { id: 'k-grand', name: 'K-Gränd' }

export default async function scrape (): Promise<MenuFile[]> {
  const baseUrl = 'https://www.kgrand.se/lunch'
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

  const menu = $('section [data-testid="inline-content"]:nth(1)').parent().html()
  if (menu == null) throw new DataError('Could not find menu', res.url, body)

  await saveHtml(menu, `${info.id}.html`)

  return [{
    type: 'html',
    src: `/assets/${info.id}.html`,
  }]
}
