import * as cheerio from 'cheerio'
import { DataError, FetchError, type RestaurantInfo, getUserAgent } from '../helpers'
import { fetch } from 'undici'
import { writeFile } from 'node:fs/promises'
import * as path from 'node:path'

export default async function scrape (): Promise<RestaurantInfo[]> {
  const baseUrl = new URL('https://www.midgarden.se/meny')
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

  const menu = $('article .content').html()
  if (menu == null) throw new DataError('Could not find menu', res.url, body)

  await writeFile(path.join(__dirname, '../dist/assets', 'midgarden.html'), menu, 'utf-8')

  return [{
    id: 'midgarden',
    name: 'Midgårdens Värdshus',
    updatedAt: new Date(),
    files: [{ type: 'html', src: '/assets/midgarden.html' }]
  }]
}
