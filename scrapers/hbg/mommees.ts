import * as cheerio from 'cheerio'
import { DataError, FetchError, getUserAgent, MenuFile, saveHtml, type RestaurantInfo } from '../../helpers.js'
import { fetch } from 'undici'

export const info: RestaurantInfo = { id: 'mommees', name: 'Mommees' }

const style = `<style>
.re_heading {
  margin-block-start: 1rem;
  font-weight: bold;
}
</style>`

export default async function scrape (): Promise<MenuFile[]> {
  const baseUrl = 'https://mommees.se/'
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

  $('.wp-block-cover').remove()
  $('.wp-block-buttons').remove()
  const menu = $('body main :where(.re-rfm, .wp-block-heading)').map((idx, el) => $.html(el)).toArray().join('').trim()
  if (menu === '') throw new DataError('Could not find menu', res.url, body)

  await saveHtml(`${style}${menu}`, `${info.id}.html`)

  return [{
    type: 'html',
    src: `/assets/${info.id}.html`,
  }]
}
