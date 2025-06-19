import * as cheerio from 'cheerio'
import { DataError, FetchError, getUserAgent, MenuFile, saveHtml, type RestaurantInfo } from '../../helpers.js'
import { fetch } from 'undici'

export const info: RestaurantInfo = { id: 'phuun-thai', name: 'Phuun Thai' }

export default async function scrape (): Promise<MenuFile[]> {
  const baseUrl = 'https://phuunthai.com/meny/hamntorget-meny/'
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

  const menu = `
    ${$('#fancy-title-6').html() ?? ''}
    ${$('#text-block-7').html() ?? ''}
    ${$('#fancy-title-9').html() ?? ''}
  `.trim()
  if (menu === '') throw new DataError('Could not find menu', res.url, body)

  await saveHtml(menu, `${info.id}.html`)

  return [{
    type: 'html',
    src: `/assets/${info.id}.html`,
  }]
}
