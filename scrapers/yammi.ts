import * as cheerio from 'cheerio'
import { DataError, FetchError, getUserAgent, saveHtml, type RestaurantInfo } from '../helpers'

const style = `<style>
  .mkdf-two-columns {
    display: grid;
    grid-template-columns: 1fr 1fr;
    width: 100%;
    gap: .5rem;
    margin-block-end: .5rem;
  }
  .mkdf-two-columns > div {
    border: 2px solid black;
  }
  li {
    list-style: none;
  }
</style>`

export default async function scrape (): Promise<RestaurantInfo[]> {
  const baseUrl = 'https://www.yammi.se/veckans-lunch/'
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

  $('.mkdf-container-inner.clearfix img').remove()
  const menu = $('.mkdf-container-inner.clearfix').html()
  if (menu == null) throw new DataError('Could not find menu', res.url, body)

  await saveHtml(`${style}${menu}`, 'yammi.html')

  return [{
    id: 'yammi',
    name: 'YaMMi',
    updatedAt: new Date(),
    files: [{
      type: 'html',
      src: '/assets/yammi.html'
    }]
  }]
}
