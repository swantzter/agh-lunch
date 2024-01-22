import * as cheerio from 'cheerio'
import { DataError, FetchError, type RestaurantInfo, getUserAgent, saveFile } from '../helpers'
import { fetch } from 'undici'

export default async function scrape (): Promise<RestaurantInfo[]> {
  const baseUrl = 'https://www.hus57.se'
  const res = await fetch(new URL('/sv/restaurang-bar/lunch', baseUrl), {
    headers: {
      accept: 'text/html',
      // IIS servers' deflate responses crashes node zlib
      'accept-encoding': 'identity',
      'cache-control': 'no-cache',
      'user-agent': getUserAgent()
    }
  })
  if (!res.ok) throw new FetchError(res.url, res.status, await res.text())

  const body = await res.text()
  const $ = cheerio.load(body)

  const menuHref = $('a:contains(MENY)').attr('href')
  if (menuHref == null) throw new DataError('Could not find link to menu', res.url, body)

  const pdfRes = await fetch(new URL(menuHref, baseUrl), {
    headers: {
      accept: 'application/pdf',
      // IIS servers' deflate responses crashes node zlib
      'accept-encoding': 'identity',
      'cache-control': 'no-cache',
      'user-agent': getUserAgent()
    }
  })

  if (!pdfRes.ok) throw new FetchError(pdfRes.url, pdfRes.status, await pdfRes.text())

  await saveFile(pdfRes, 'hus57.pdf')

  return [{
    id: 'hus57',
    name: 'Hus 57',
    updatedAt: new Date(),
    files: [{ type: 'pdf', src: '/assets/hus57.pdf' }]
  }]
}
