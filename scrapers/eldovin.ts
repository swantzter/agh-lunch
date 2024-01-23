import * as cheerio from 'cheerio'
import { FetchError, type RestaurantInfo, getUserAgent, saveHtml } from '../helpers'
import { fetch } from 'undici'

export default async function scrape (): Promise<RestaurantInfo[]> {
  const baseUrl = new URL('https://eldochvin.se/lunch/')
  const res = await fetch(baseUrl, {
    headers: {
      accept: 'text/html',
      'cache-control': 'no-cache',
      'user-agent': getUserAgent()
    }
  })
  if (!res.ok) throw new FetchError(res.url, res.status, await res.text())

  const body = await res.text()
  const $ = cheerio.load(body)

  const storgatan: string[] = []
  const heimdall: string[] = []
  let current = storgatan

  $('#lunchmeny p').each((idx, p) => {
    const $$ = cheerio.load(p, null, false)
    if ($$.text().toLocaleLowerCase().includes('heimdall')) {
      current = heimdall
    } else if ($$.text().toLocaleLowerCase().includes('storgatan')) {
      current = storgatan
    }
    current.push($$.html())
  })

  await saveHtml(storgatan.join('\n'), 'eldovin-storgatan.html')
  await saveHtml(heimdall.join('\n'), 'eldovin-heimdallgatan.html')

  const updatedAt = new Date()
  return [
    {
      id: 'eldovin-storgatan',
      name: 'Eld&Vin Storgatan',
      updatedAt,
      files: [{ type: 'html', src: '/assets/eldovin-storgatan.html' }]
    },
    {
      id: 'eldovin-heimdallgatan',
      name: 'Eld&Vin Heimdallgatan',
      updatedAt,
      files: [{ type: 'html', src: '/assets/eldovin-heimdallgatan.html' }]
    }
  ]
}
