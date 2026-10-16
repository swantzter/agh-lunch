import * as cheerio from 'cheerio'
import { DataError, FetchError, getUserAgent, saveHtml, type RestaurantInfo, type MenuFile } from '../../helpers.js'

const style = `<style>
  body > div > div {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }
  article {
    margin-block-end: .5rem;
  }
  article > div:first-child {
    font-weight: bold;
  }
  article p {
    margin-block: 0;
  }
  span:not(:last-child)::after {
    content: ' · ';
  }
</style>`

export const info: RestaurantInfo = { id: 'yammi', name: 'YaMMi', autoplayDuration: 10_000 }

export default async function scrape (): Promise<MenuFile[]> {
  const baseUrl = 'https://www.yammi.se/restauranger/angelholm'
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

  const section = $('section:has(div:contains("Veckomeny"))').last()
  if (section.length === 0) throw new DataError('Could not find menu', res.url, body)

  section.find('h2, a, svg').remove()
  section.find('*').removeAttr('class').removeAttr('style')
  const menu = section.html()
  if (menu == null) throw new DataError('Could not find menu', res.url, body)

  await saveHtml(`${style}${menu}`, 'yammi.html')

  return [{
    type: 'html',
    src: '/assets/yammi.html',
  }]
}
