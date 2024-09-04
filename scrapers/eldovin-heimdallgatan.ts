import * as cheerio from 'cheerio'
import { DataError, FetchError, type RestaurantInfo, getUserAgent, saveHtml } from '../helpers'
import { fetch } from 'undici'

export const info: RestaurantInfo = { id: 'eldovin-heimdallgatan', name: 'Eld&Vin Heimdallgatan', autoplayDuration: 10_000 }

export default async function scrape () {
  const baseUrl = new URL('https://eldochvin.se/lunch/')
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

  $('#lunchmeny a').remove()
  const menu = $('#lunchmeny').html()
  if (menu == null) throw new DataError('Could not find menu', res.url, body)

  await saveHtml(menu, 'eldovin-heimdallgatan.html')
  return [{ type: 'html', src: '/assets/eldovin-heimdallgatan.html' }]
}
