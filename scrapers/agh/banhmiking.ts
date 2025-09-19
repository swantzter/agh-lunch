import * as cheerio from 'cheerio'
import { DataError, FetchError, getUserAgent, saveHtml, type RestaurantInfo, type MenuFile } from '../../helpers.js'

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
  h4 {
    margin-block-end: 0;
    margin-block-start: .5rem;
  }
  p {
    margin-block-start: 0;
    margin-block-end: .5rem;
  }
  .vc_empty_space {
    display: none;
  }
  li {
    list-style: none;
  }
</style>`

export const info: RestaurantInfo = { id: 'banhmiking', name: 'Banh Mi King', autoplayDuration: 10_000 }

export default async function scrape (): Promise<MenuFile[]> {
  const baseUrl = 'https://www.banhmiking.se/daily-lunch-specials-vietnamese-street-food-in-helsingborg-angelholm/'
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

  $('.mkdf-container-inner.clearfix .mkdf-full-section-inner img').remove()
  const menu = $('.mkdf-container-inner.clearfix .mkdf-full-section-inner').html()
  if (menu == null) throw new DataError('Could not find menu', res.url, body)

  await saveHtml(`${style}${menu}`, 'banhmiking.html')

  return [{
    type: 'html',
    src: '/assets/banhmiking.html',
  }]
}
