import * as cheerio from 'cheerio'
import { DataError, FetchError, type RestaurantInfo, getUserAgent, saveHtml, type MenuFile } from '../../helpers.js'
import { fetch } from 'undici'

const style = `<style>
  p {
    margin-block: 0 .25rem;
  }
  p:has(strong) {
    margin-block-start: .75rem;
  }
</style>`

export const info: RestaurantInfo = { id: 'nimt', name: 'Restaurang Nimt', autoplayDuration: 10_000 }

export default async function scrape (): Promise<MenuFile[]> {
  const baseUrl = new URL('https://www.hotelvalhallpark.se/dagens-lunch-angelholm/')
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

  const content = $('.theme-page-wrapper .theme-content')
  content.find('img, .clearboth').remove()
  const menu = content.html()
  if (menu == null || !/måndag/i.test(content.text())) throw new DataError('Could not find menu element', res.url, body)

  await saveHtml(`${style}${menu}`, 'nimt.html')

  return [{ type: 'html', src: '/assets/nimt.html' }]
}
