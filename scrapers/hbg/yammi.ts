import * as cheerio from 'cheerio'
import { DataError, FetchError, getUserAgent, saveHtml, type RestaurantInfo, type MenuFile } from '../../helpers.js'

const style = `<style>
  .et_pb_row_1 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    width: 100%;
    gap: .5rem;
    margin-block-end: .5rem;
  }
  li {
    list-style: none;
  }
</style>`

export const info: RestaurantInfo = { id: 'yammi-hbg', name: 'YaMMi', autoplayDuration: 10_000 }

export default async function scrape (): Promise<MenuFile[]> {
  const baseUrl = 'https://helsingborg.yammi.se/lunch/'
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

  const menu = $('#post-692').html()
  if (menu == null) throw new DataError('Could not find menu', res.url, body)

  await saveHtml(`${style}${menu}`, 'yammi-hbg.html')

  return [{
    type: 'html',
    src: '/assets/yammi-hbg.html',
  }]
}
