import { type RestaurantInfo, type MenuFile } from '../../helpers.js'

export const info: RestaurantInfo = { id: 'banhmiking', name: 'Banh Mi King', autoplayDuration: 10_000 }

// eslint-disable-next-line @typescript-eslint/require-await
export default async function scrape (): Promise<MenuFile[]> {
  // Same as the AGH menu
  return [{
    type: 'html',
    src: '/assets/banhmiking.html',
  }]
}
