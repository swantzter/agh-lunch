import * as cheerio from 'cheerio'
import { DataError, FetchError, getUserAgent, MenuFile, saveHtml, type RestaurantInfo } from '../../helpers.js'
import { fetch } from 'undici'
import { ElementType } from 'domelementtype'

export const info: RestaurantInfo = { id: 'nordrest', name: 'Nordrest' }

const style = `<style>
.nordrest-week { margin-bottom: 1rem; font-weight: bold; font-size: 1.2em; }
.nordrest-day { margin-bottom: 1.5rem; }
.nordrest-day-title { font-weight: bold; margin-bottom: 0.5rem; font-size: 1.125rem; }
.nordrest-dish { margin-bottom: 0.75rem; }
.nordrest-dish-title { font-weight: 600; }
.nordrest-dish-desc { font-style: italic; }
.nordrest-dish-allergens { font-size: 0.85em; color: #666; }
.nordrest-soldout { text-decoration: line-through; opacity: 0.6; }
</style>`

function cleanText (text: string): string {
  return text.replace(/\s+/g, ' ').trim()
}

export default async function scrape (): Promise<MenuFile[]> {
  const baseUrl = new URL('restaurang/fabriken/', 'https://www.nordrest.se')
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

  const lunch = $('[data-castit-lunch="1"]')
  if (lunch.length === 0) throw new DataError('Could not find lunch container', res.url, body)

  const activePanel = lunch.find('[data-week-panel="1"].is-active').length > 0
    ? lunch.find('[data-week-panel="1"].is-active')
    : lunch.find('[data-week-panel="1"]').first()
  if (activePanel.length === 0) throw new DataError('Could not find week panel', res.url, body)

  const weekNo = cleanText(activePanel.attr('data-week') ?? '')

  const menuParts: string[] = []
  if (weekNo) {
    menuParts.push(`<div class="nordrest-week">Vecka ${weekNo}</div>`)
  }

  activePanel.find('.castit-day').each((_, dayEl) => {
    const $day = $(dayEl)
    const dayTitle = cleanText($day.find('.castit-day__title').text())
    if (!dayTitle) return

    const dishes: string[] = []
    $day.find('.castit-dish').each((_, dishEl) => {
      const $dish = $(dishEl)
      const titleEl = $dish.find('.castit-dish__title')
      let title = ''
      if (titleEl.length > 0) {
        // Get only the first text node (like the original JS does)
        const contents = titleEl.contents().toArray()
        for (const node of contents) {
          if (node.type === ElementType.Text && cleanText(node.data).length > 0) {
            title = cleanText(node.data)
            break
          }
        }
        if (!title) {
          title = cleanText(titleEl.text())
        }
      }
      if (!title) return

      const desc = cleanText($dish.find('.castit-dish__desc').text())
      const allergens = cleanText($dish.find('.castit-dish__allergens').text())
      const soldOut = $dish.find('.castit-soldout-badge').length > 0

      const soldOutClass = soldOut ? ' nordrest-soldout' : ''
      let dishHtml = `<div class="nordrest-dish${soldOutClass}">`
      dishHtml += `<div class="nordrest-dish-title">${title}</div>`
      if (desc) dishHtml += `<div class="nordrest-dish-desc">${desc}</div>`
      if (allergens) dishHtml += `<div class="nordrest-dish-allergens">${allergens}</div>`
      dishHtml += '</div>'
      dishes.push(dishHtml)
    })

    if (dishes.length > 0) {
      menuParts.push('<div class="nordrest-day">')
      menuParts.push(`<div class="nordrest-day-title">${dayTitle}</div>`)
      menuParts.push(dishes.join(''))
      menuParts.push('</div>')
    }
  })

  const menu = menuParts.join('')
  if (menu === '') throw new DataError('Could not extract any menu items', res.url, body)

  await saveHtml(`${style}${menu}`, `${info.id}.html`)

  return [{
    type: 'html',
    src: `/assets/${info.id}.html`,
  }]
}
