import * as cheerio from 'cheerio'
import { DataError, FetchError, type RestaurantInfo, getUserAgent, saveFile, savePdfImg, type MenuFile } from '../../helpers.js'
import { fetch } from 'undici'

export const info: RestaurantInfo = { id: 'bankpalatset', name: 'Bankpalatset', autoplayDuration: 10_000 }

export default async function scrape (): Promise<MenuFile[]> {
  const baseUrl = 'https://bankpalats.se'
  const res = await fetch(new URL('/Hemsida/menyer', baseUrl), {
    headers: {
      accept: 'text/html',
      'cache-control': 'no-cache',
      'user-agent': getUserAgent(),
    },
  })
  if (!res.ok) throw new FetchError(res.url, res.status, await res.text())

  const body = await res.text()
  const $ = cheerio.load(body)

  const menuHref = $('a[data-testid="button"]')
    .filter((_, el) => $(el).text().trim().toLowerCase() === 'lunchmeny')
    .attr('href')
  if (menuHref == null) throw new DataError('Could not find link to menu', res.url, body)

  const menuUrl = new URL(menuHref, baseUrl)
  const menuRes = await fetch(menuUrl, {
    headers: {
      accept: 'image/*,application/pdf',
      'cache-control': 'no-cache',
      'user-agent': getUserAgent(),
    },
  })
  if (!menuRes.ok) throw new FetchError(menuRes.url, menuRes.status, await menuRes.text())

  const contentType = menuRes.headers.get('content-type') ?? ''
  if (contentType.includes('pdf') || menuUrl.pathname.toLowerCase().endsWith('.pdf')) {
    const pages = await savePdfImg(menuRes, 'bankpalatset')
    return pages.map(p => ({
      type: 'image',
      src: `/assets/${p.name}`,
    }))
  }

  const ext = /^image\/(png|jpeg|webp|gif)/.exec(contentType)?.[1]?.replace('jpeg', 'jpg') ?? 'png'
  await saveFile(menuRes, `bankpalatset.${ext}`)

  return [{
    type: 'image',
    src: `/assets/bankpalatset.${ext}`,
  }]
}
