import * as cheerio from 'cheerio'
import { DataError, FetchError, getUserAgent, saveHtml, type RestaurantInfo, type MenuFile } from '../../helpers.js'

const style = `<style>
  section > div > div:last-child {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: .5rem;
  }
  article {
    border: 2px solid black;
    padding: .25rem .5rem;
  }
  h2 {
    display: none;
  }
  h3, h4 {
    margin-block: .25rem 0;
  }
  p {
    margin-block: 0 .25rem;
  }
  span + span::before {
    content: ' · ';
  }
</style>`

export const info: RestaurantInfo = { id: 'banhmiking', name: 'Banh Mi King', autoplayDuration: 10_000 }

export default async function scrape (): Promise<MenuFile[]> {
  const baseUrl = 'https://www.banhmiking.se/lunch'
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

  // The weekday menu, and the weekly offers that are available every day
  const sections = $('main section')
    .filter((_, el) => $(el).find('h3').filter((_, h) => /^(måndag|tisdag|onsdag|torsdag|fredag)$/i.test($(h).text().trim())).length > 0 ||
      $(el).text().includes('lunchpris'))
  if (sections.length === 0) throw new DataError('Could not find menu', res.url, body)

  sections.find('svg, img, a').remove()
  sections.add(sections.find('*')).removeAttr('class').removeAttr('style')
  const menu = sections.toArray().map(el => $.html(el)).join('')

  await saveHtml(`${style}${menu}`, 'banhmiking.html')

  return [{
    type: 'html',
    src: '/assets/banhmiking.html',
  }]
}
