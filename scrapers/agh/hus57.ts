import * as cheerio from 'cheerio'
import { DataError, FetchError, type RestaurantInfo, getUserAgent, savePdfImg, type MenuFile } from '../../helpers.js'
import { fetch } from 'undici'
import * as path from 'node:path'

export const info: RestaurantInfo = { id: 'hus57', name: 'Hus 57', autoplayDuration: 10_000 }

export default async function scrape (): Promise<MenuFile[]> {
  const baseUrl = 'https://www.hus57.se'
  const res = await fetch(new URL('/sv/restaurang-bar/lunch', baseUrl), {
    headers: {
      accept: 'text/html',
      // IIS servers' deflate responses crashes node zlib
      'accept-encoding': 'identity',
      'cache-control': 'no-cache',
      'user-agent': getUserAgent(),
    },
  })
  if (!res.ok) throw new FetchError(res.url, res.status, await res.text())

  const body = await res.text()
  const $ = cheerio.load(body)

  const menuHref = $('a:contains(LUNCH)').attr('href')
  if (menuHref == null) throw new DataError('Could not find link to menu', res.url, body)

  const pdfRes = await fetch(new URL(menuHref, baseUrl), {
    headers: {
      accept: 'application/pdf',
      // IIS servers' deflate responses crashes node zlib
      'accept-encoding': 'identity',
      'cache-control': 'no-cache',
      'user-agent': getUserAgent(),
    },
  })

  if (!pdfRes.ok) throw new FetchError(pdfRes.url, pdfRes.status, await pdfRes.text())

  const pages = await savePdfImg(pdfRes, 'hus57')

  return pages.map(p => ({
    type: 'image',
    src: `/${path.relative(path.resolve(import.meta.dirname, '../_site'), p.path)}`,
  }))
}
