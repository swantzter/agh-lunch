import { type RestaurantInfo } from '../helpers'
import { scrapeFactory } from './eldovin-storgatan'

export const info: RestaurantInfo = { id: 'eldovin-heimdallgatan', name: 'Eld&Vin Heimdallgatan' }

export default scrapeFactory('heimdallgatan')
