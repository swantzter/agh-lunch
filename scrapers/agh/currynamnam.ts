import * as cheerio from 'cheerio'
import { type MenuFile, getUserAgent, type RestaurantInfo, FetchError, DataError, saveHtml } from '../../helpers.js'

export const info: RestaurantInfo = { id: 'currynamnam', name: 'Curry Nam Nam', autoplayDuration: 20_000 }

const dayMenus: Record<number, string> = {
  1: '/mandag-angelholm/',
  2: '/tisdag/',
  3: '/onsdag/',
  4: '/torsdag/',
  5: '/fredag-2/',
  6: '/mandag-angelholm/',
  7: '/mandag-angelholm/',
}

export default async function scrape (): Promise<MenuFile[]> {
  const baseUrl = new URL(dayMenus[new Date().getDay()], 'https://www.currynamnam.se/')
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

  $('.et_pb_module.et_pb_text.et_pb_text_1 [style]').removeAttr('style')
  const menu = $('.et_pb_module.et_pb_text.et_pb_text_1').html()
  if (menu == null) throw new DataError('Could not find menu', res.url, body)

  await saveHtml(menu, 'currynamnam.html')

  return [{ type: 'html', src: '/assets/currynamnam.html' }]
}
