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
        short: 's',
      },
    },
  })

  const paths = await readdir(path.join(__dirname, 'scrapers'))
  const scraperFiles = paths
    .filter(file => (!file.startsWith('.')) && (file.endsWith('.js') || file.endsWith('.ts')))
    .filter(file => args.values.scraper == null || args.values.scraper.length === 0 ? true : args.values.scraper.includes(file))

  const restaurants: RestaurantInfo[] = []

  for (const scraper of scraperFiles) {
    console.log(scraper)
    const mod = await import(path.join(__dirname, 'scrapers', scraper)) as { default?: () => Promise<MenuFile[]>, info: RestaurantInfo }
    const info = { ...mod.info }
    restaurants.push(info)
    if (mod.default != null) {
      try {
        const files = await mod.default()
        console.log(files)
        info.files = files
        info.updatedAt = new Date()
      } catch (err) {
        console.error('Failed to run scraper', err)
      }
    }
  }

  try {
    const prevManifest = JSON.parse(await readFile(manifestPath, 'utf-8')) as RestaurantInfo[]

    // If we fetched it before and failed now, use the previous menu
    for (let idx = 0; idx < restaurants.length; idx++) {
      const prevRes = prevManifest.find(r => r.id === restaurants[idx].id)
      if (prevRes != null) restaurants.splice(idx, 1, { ...prevRes, ...restaurants[idx] })
    }
  } catch {}

  await writeFile(manifestPath, JSON.stringify(restaurants, null, 2), 'utf-8')
}

run()
  .then(() => { process.exit(0) })
  .catch((err: unknown) => { console.error(err); process.exit(1) })
