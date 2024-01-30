import * as cheerio from 'cheerio'
import { FetchError, type RestaurantInfo, getUserAgent, saveHtml, type MenuFile } from '../helpers'
import { fetch } from 'undici'

export const info: RestaurantInfo = { id: 'eldovin-storgatan', name: 'Eld&Vin Storgatan', autoplayDuration: 20_000 }

const storgatan: string[] = []
const heimdall: string[] = []

export function scrapeFactory (restaurant: 'storgatan' | 'heimdallgatan'): () => Promise<MenuFile[]> {
  return async function scrape () {
    if (restaurant === 'storgatan' && storgatan.length > 0) {
      await saveHtml(storgatan.join('\n'), 'eldovin-storgatan.html')
      return [{ type: 'html', src: '/assets/eldovin-storgatan.html' }]
    } else if (restaurant === 'heimdallgatan' && heimdall.length > 0) {
      await saveHtml(heimdall.join('\n'), 'eldovin-heimdallgatan.html')
      return [{ type: 'html', src: '/assets/eldovin-heimdallgatan.html' }]
    }

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

    if (restaurant === 'storgatan') {
      await saveHtml(storgatan.join('\n'), 'eldovin-storgatan.html')
      return [{ type: 'html', src: '/assets/eldovin-storgatan.html' }]
    } else if (restaurant === 'heimdallgatan') {
      await saveHtml(heimdall.join('\n'), 'eldovin-heimdallgatan.html')
      return [{ type: 'html', src: '/assets/eldovin-heimdallgatan.html' }]
    } else throw new TypeError('Invalid sub-restaurant')
  }
}

export default scrapeFactory('storgatan')
