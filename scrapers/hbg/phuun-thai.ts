import * as cheerio from 'cheerio'
import { DataError, FetchError, getUserAgent, MenuFile, saveHtml, type RestaurantInfo } from '../../helpers.js'
import { fetch } from 'undici'

const style = `<style>
  li {
    display: grid;
    grid-template-columns: 1.5rem 1fr auto;
    gap: .5rem;
    margin-block-end: .5rem;
  }
  ol, ul {
    padding: 0;
  }
  ul li {
    display: list-item;
    list-style: none;
  }
</style>`

export const info: RestaurantInfo = { id: 'phuun-thai', name: 'Phuun Thai' }

export default async function scrape (): Promise<MenuFile[]> {
  // The apex domain has no TLS certificate on Vercel (the handshake is closed
  // without one), but it's served fine over plain HTTP
  const baseUrl = 'http://phuunthai.com/lunch/'
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

  const week = $('section.week').first()
  if (week.length === 0) throw new DataError('Could not find menu', res.url, body)
  const facts = $('section.lunch ul.facts')
  facts.find('a').each((_, el) => { $(el).replaceWith($(el).text()) })

  const menu = `${$.html(week)}${facts.length > 0 ? $.html(facts) : ''}`

  await saveHtml(`${style}${menu}`, `${info.id}.html`)

  return [{
    type: 'html',
    src: `/assets/${info.id}.html`,
  }]
}
