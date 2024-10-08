import * as cheerio from 'cheerio'
import { DataError, FetchError, getUserAgent, saveHtml, type RestaurantInfo, type MenuFile } from '../helpers'

const style = `<style>
p, h1, h2, h3, h4, h5 {
  text-align: center;
}
</style>`

export const info: RestaurantInfo = { id: 'jasmine', name: 'Jasmine Thai', autoplayDuration: 10_000 }

export default async function scrape (): Promise<MenuFile[]> {
  const baseUrl = 'https://www.jasminethairestaurang.com/dagens'
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

  $('section .wixui-repeater img').remove()
  const menu = $('section .wixui-repeater').html()
  if (menu == null) throw new DataError('Could not find menu', res.url, body)

  await saveHtml(`${style}${menu}`, 'jasmine.html')

  return [{ type: 'html', src: '/assets/jasmine.html' }]
}
