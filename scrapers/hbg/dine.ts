import * as cheerio from 'cheerio'
import { DataError, FetchError, type RestaurantInfo, getUserAgent, savePdfImg, type MenuFile } from '../../helpers.js'
import { fetch } from 'undici'

export const info: RestaurantInfo = { id: 'dine', name: 'DINÉ Burgers', autoplayDuration: 10_000 }

export default async function scrape (): Promise<MenuFile[]> {
  const baseUrl = 'https://www.dineburgers.se'
  const res = await fetch(new URL('/meny', baseUrl), {
    headers: {
      accept: 'text/html',
      'cache-control': 'no-cache',
      'user-agent': getUserAgent(),
    },
  })
  if (!res.ok) throw new FetchError(res.url, res.status, await res.text())

  const body = await res.text()
  const $ = cheerio.load(body)

  const menuHref = $('main article a[href*="helsingborg" i]').attr('href')
  if (menuHref == null) throw new DataError('Could not find link to menu', res.url, body)

  const pdfRes = await fetch(new URL(menuHref, baseUrl), {
    headers: {
      accept: 'application/pdf',
      'cache-control': 'no-cache',
      'user-agent': getUserAgent(),
    },
  })

  if (!pdfRes.ok) throw new FetchError(pdfRes.url, pdfRes.status, await pdfRes.text())

  const pages = await savePdfImg(pdfRes, 'dine')

  return [{
    type: 'image',
    src: `/assets/${pages[1].name}`,
  }]
}
