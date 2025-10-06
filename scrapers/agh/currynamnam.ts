import * as cheerio from 'cheerio'
import { type MenuFile, getUserAgent, type RestaurantInfo, FetchError, DataError, saveHtml } from '../../helpers.js'

export const info: RestaurantInfo = { id: 'currynamnam', name: 'Curry Nam Nam', autoplayDuration: 20_000 }

const style = `<style>
  .e-flex {
    display: flex;
    flex-direction: column;
  }

  .elementor-element-fce567e,
  .elementor-element-520817c3 {
    flex-direction: row;
    gap: 2rem;
  }

  h2 {
    font-size: 1.25rem;
    margin: 0;
    color: orangered;
  }

  a {
    text-decoration: none;
    color: inherit;
  }

  ul {
    padding: 0;
  }

  li {
    list-style: none;
  }

  li .elementor-price-list-header {
    font-weight: bold;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
  }

  li p {
    margin-block-start: 0;
  }
</style>`

export async function curryNamNamCityScrape (city: 'angelholm' | 'helsingborg'): Promise<MenuFile[]> {
  const baseUrl = new URL(`indiskt-i-${city}`, 'https://www.currynamnam.se/')
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

  const menu = $('#dagens').html()
  if (menu == null) throw new DataError('Could not find menu', res.url, body)

  await saveHtml(`${style}${menu}`, `currynamnam-${city}.html`)

  return [{ type: 'html', src: `/assets/currynamnam-${city}.html` }]
}

export default async function scrape (): Promise<MenuFile[]> {
  return await curryNamNamCityScrape('angelholm')
}
