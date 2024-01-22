import * as cheerio from 'cheerio'
import { DataError, FetchError, type RestaurantInfo, getUserAgent } from '../helpers'
import { fetch } from 'undici'
import { writeFile } from 'node:fs/promises'
import * as path from 'node:path'

export default async function scrape (): Promise<RestaurantInfo[]> {
  const baseUrl = new URL('https://www.hotelvalhallpark.se/hotellrestaurang/')
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

  const menu = $('h4:contains(Lunchmat)').parent().parent().html()
  if (menu == null) throw new DataError('Could not find menu element', res.url, body)

  await writeFile(path.join(__dirname, '../dist/assets', 'nimt.html'), menu, 'utf-8')

  return [{
    id: 'nimt',
    name: 'Restaurang Nimt',
    updatedAt: new Date(),
    files: [{ type: 'html', src: '/assets/nimt.html' }]
  }]
}
