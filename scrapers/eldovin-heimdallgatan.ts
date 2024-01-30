import { type RestaurantInfo } from '../helpers'
import { scrapeFactory } from './eldovin-storgatan'

export const info: RestaurantInfo = { id: 'eldovin-heimdallgatan', name: 'Eld&Vin Heimdallgatan', autoplayDuration: 10_000 }

export default scrapeFactory('heimdallgatan')
