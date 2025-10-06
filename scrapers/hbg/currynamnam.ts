import { type MenuFile, type RestaurantInfo } from '../../helpers.js'
import { curryNamNamCityScrape } from '../agh/currynamnam.js'

export const info: RestaurantInfo = { id: 'currynamnam', name: 'Curry Nam Nam', autoplayDuration: 20_000 }

export default async function scrape (): Promise<MenuFile[]> {
  return await curryNamNamCityScrape('helsingborg')
}
