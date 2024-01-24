import { readFile, readdir, writeFile } from 'node:fs/promises'
import * as path from 'node:path'
import { parseArgs } from 'node:util'
import { type MenuFile, type RestaurantInfo } from './helpers'

const manifestPath = path.join(__dirname, '_site/restaurants.json')

async function run () {
  const args = parseArgs({
    allowPositionals: false,
    options: {
      scraper: {
        type: 'string',
        multiple: true,
        short: 's'
      }
    }
  })

  const paths = await readdir(path.join(__dirname, 'scrapers'))
  const scraperFiles = paths
    .filter(file => (file.indexOf('.') !== 0) && (file.slice(-3) === '.js' || file.slice(-3) === '.ts'))
    .filter(file => args.values.scraper == null || args.values.scraper.length === 0 ? true : args.values.scraper.includes(file))

  const restaurants: RestaurantInfo[] = []

  for (const scraper of scraperFiles) {
    console.log(scraper)
    const mod = await import(path.join(__dirname, 'scrapers', scraper))
    const info = { ...(mod.info as RestaurantInfo) }
    restaurants.push(info)
    if (mod.default != null) {
      try {
        const files = await mod.default() as MenuFile[]
        console.log(files)
        info.files = files
        info.updatedAt = new Date()
      } catch (err) {
        console.error('Failed to run scraper', err)
      }
    }
  }

  try {
    const prevManifest: RestaurantInfo[] = JSON.parse(await readFile(manifestPath, 'utf-8'))

    for (const restaurant of prevManifest) {
      if (restaurants.find(r => r.id === restaurant.id) == null) {
        restaurants.push(restaurant)
      }
    }
  } catch {}

  await writeFile(manifestPath, JSON.stringify(restaurants, null, 2), 'utf-8')
}

run()
  .then(() => { process.exit(0) })
  .catch(err => { console.error(err); process.exit(1) })
