import * as cheerio from 'cheerio'
import { DataError, FetchError, type RestaurantInfo, getUserAgent, saveHtml, type MenuFile } from '../../helpers.js'
import { fetch } from 'undici'

const style = `<style>
  .menu-item {
    margin-block-end: .5rem;
  }
  .menu-item-title {
    font-weight: bold;
  }
</style>`

export const info: RestaurantInfo = { id: 'midgarden', name: 'Midgårdens Värdshus', autoplayDuration: 10_000 }

export default async function scrape (): Promise<MenuFile[]> {
  const baseUrl = new URL('https://www.midgarden.se/lunchbuffe')
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

  // The second dish of the day is in the price field, which is rendered both
  // above and below the title depending on layout
  $('.menu-item-price-top').remove()
  const menu = $('.sqs-block-menu .menu-items').html()
  if (menu == null) throw new DataError('Could not find menu', res.url, body)

  await saveHtml(`${style}${menu}`, 'midgarden.html')

  return [{ type: 'html', src: '/assets/midgarden.html' }]
}
