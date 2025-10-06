import * as cheerio from 'cheerio'
import { DataError, FetchError, getUserAgent, MenuFile, saveHtml, type RestaurantInfo } from '../../helpers.js'
import { fetch } from 'undici'

export const info: RestaurantInfo = { id: 'doori', name: 'Doori' }

const style = `<style>
  .kt-has-2-columns {
    display: flex;
    gap: 2rem;
  }
  .inner-column-1 {
    display: non;
  }
  .price-background {
    display: none;
  }
</style>`

export default async function scrape (): Promise<MenuFile[]> {
  const baseUrl = 'https://www.doori.se/meny/'
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

  $('article figure').remove()
  $('article ul').remove()
  const menu = $('article .entry-content').html()
  if (menu == null) throw new DataError('Could not find menu', res.url, body)

  await saveHtml(`${style}${menu}`, `${info.id}.html`)

  return [{
    type: 'html',
    src: `/assets/${info.id}.html`,
  }]
}
