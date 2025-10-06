import * as acorn from 'acorn'
import * as cheerio from 'cheerio'
import { DataError, FetchError, getUserAgent, MenuFile, saveHtml, type RestaurantInfo } from '../../helpers.js'
import { fetch } from 'undici'

export const info: RestaurantInfo = { id: 'thai-corner', name: 'Thai Corner' }

const style = `<style>
.tc__meny__veckodag {
  margin-block-start: 1rem;
  font-weight: bold;
}
</style>`

export default async function scrape (): Promise<MenuFile[]> {
  const startingUrl = 'https://thaicorner.se/'
  const startingPageRes = await fetch(startingUrl, {
    headers: {
      accept: 'text/html',
      'cache-control': 'no-cache',
      'user-agent': getUserAgent(),
    },
  })
  if (!startingPageRes.ok) throw new FetchError(startingPageRes.url, startingPageRes.status, await startingPageRes.text())

  const startingBody = await startingPageRes.text()
  const $0 = cheerio.load(startingBody)

  const menuPageUrl = $0('section#banner_hero a[href*="meny.php"]').attr('href')
  if (menuPageUrl == null) throw new DataError('Could not find link to menu landing page', startingPageRes.url, startingBody)

  const menuPageRes = await fetch(new URL(menuPageUrl, startingUrl), {
    headers: {
      accept: 'text/html',
      'cache-control': 'no-cache',
      'user-agent': getUserAgent(),
    },
  })
  if (!menuPageRes.ok) throw new FetchError(menuPageRes.url, menuPageRes.status, await menuPageRes.text())

  const landingBody = await menuPageRes.text()
  const $1 = cheerio.load(landingBody)

  const menuUrl = $1('script[src^="https://bordsbokaren.se/api/meny-lunch-thai-corner.php"]').attr('src')
  if (menuUrl == null) throw new DataError('Could not find link to menu', menuPageRes.url, landingBody)

  const res = await fetch(menuUrl, {
    headers: {
      accept: 'text/html',
      'cache-control': 'no-cache',
      'user-agent': getUserAgent(),
    },
  })
  if (!res.ok) throw new FetchError(res.url, res.status, await res.text())

  const body = await res.text()
  const program = acorn.parse(String(body), { ecmaVersion: 'latest', sourceType: 'script' })

  const ifStatement = program.body.findLast(node => node.type === 'IfStatement')
  const ifStatementBody = ifStatement?.consequent.type === 'BlockStatement' ? ifStatement.consequent.body : null
  const menuVariable = ifStatementBody?.find(node => node.type === 'VariableDeclaration' && node.declarations[0].id.type === 'Identifier' && node.declarations[0].id.name === 'txt')
  const menuVariableValue = (menuVariable?.type === 'VariableDeclaration'
    ? menuVariable.declarations[0].init?.type === 'Literal'
      ? menuVariable.declarations[0].init.value
      : menuVariable.declarations[0].init?.type === 'TemplateLiteral'
        ? menuVariable.declarations[0].init.expressions.length === 0 && menuVariable.declarations[0].init.quasis.length === 1
          ? menuVariable.declarations[0].init.quasis[0].value.cooked ?? menuVariable.declarations[0].init.quasis[0].value.raw
          : null
        : null
    : null) as string | null

  if (menuVariableValue == null) throw new DataError('Could not find menu HTML (variable "txt") in the script', res.url, body)

  const $ = cheerio.load(menuVariableValue)

  $('img').remove()
  const menuHtml = $('body').html()

  if (menuHtml == null) throw new DataError('Failed to extract menu HTML from variable value', res.url, body)

  await saveHtml(`${style}${menuHtml}`, `${info.id}.html`)

  return [{
    type: 'html',
    src: `/assets/${info.id}.html`,
  }]
}
