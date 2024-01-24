import { createApp } from 'https://unpkg.com/petite-vue?module'

const dateFormatter = new Intl.RelativeTimeFormat(['sv-SE', 'sv', 'en-SE', 'en-GB', 'en'], { style: 'short', numeric: 'auto' })
const autoplayTime = 20_000
const fetchTime = 1000 * 60 * 60 // 1h

createApp({
  now: Date.now(),
  lastChange: -Infinity,
  lastFetch: -Infinity,
  autoPlay: true,

  ongoingFetch: null,
  currentRestaurantId: null,
  restaurants: [],

  get menuRestaurants() {
    return this.restaurants.filter(r => r.files != null && r.files.length > 0)
  },
  get listRestaurants() {
    return this.restaurants.filter(r => r.files == null || r.files.length === 0)
  },
  get currentRestaurant() {
    return this.restaurants.find(r => r.id === this.currentRestaurantId)
  },
  get switchProgress() {
    return `${Math.round((1 - (Math.abs(this.now - this.lastChange) / autoplayTime)) * 100)}%`
  },

  mounted() {
    this.fetchRestaurants()
    this.startTimers()
  },

  startTimers() {
    setInterval(() => {
      // This makes displayed dates and such update
      this.now = Date.now()

      // Change the currently displayed menu on an interval
      if (
        Math.abs(this.now - this.lastChange) > autoplayTime &&
        this.menuRestaurants.length > 0 &&
        this.autoPlay
      ) {
        this.nextRestaurant()
      }

      if (Math.abs(this.now - this.lastChange) > fetchTime) {
        this.fetchRestaurants()
      }
    }, 1_000)
  },
  async fetchRestaurants() {
    if (this.ongoingFetch) return
    try {
      this.ongoingFetch = fetch('/restaurants.json', { headers: { accept: 'application/json' } })
      const res = await this.ongoingFetch
      if (!res.ok) console.error('Failed to fetch restaurants manifest')
      const restaurants = await res.json()
      restaurants.sort((a, b) => a.name.localeCompare(b.name))

      this.restaurants = restaurants
      this.lastFetch = Date.now()

      if (this.autoPlay || this.restaurants.find(r => r.id === this.currentRestaurantId) == null) {
        this.nextRestaurant()
      }
    } finally {
      this.ongoingFetch = null
    }
  },
  nextRestaurant() {
    const currIdx = this.menuRestaurants.findIndex(r => r.id === this.currentRestaurantId)
    if (currIdx === -1 || currIdx >= this.menuRestaurants.length - 1) {
      this.currentRestaurantId = this.menuRestaurants[0].id
    } else {
      this.currentRestaurantId = this.menuRestaurants[currIdx + 1].id
    }
    this.lastChange = Date.now()
    document.getElementById(`a-${this.currentRestaurantId}`)?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
      inline: 'center'
    })
  },
  toggleAutoPlay() {
    if (!this.autoPlay) this.nextRestaurant()
    this.autoPlay = !this.autoPlay
  },

  formatDate(date) {
    let diff = (new Date(date).getTime() - this.now) / 1000
    if (Math.abs(diff) < 60) return dateFormatter.format(Math.round(diff), 'second')
    diff = diff / 60
    if (Math.abs(diff) < 60) return dateFormatter.format(Math.round(diff), 'minute')
    diff = diff / 60
    if (Math.abs(diff) < 60) return dateFormatter.format(Math.round(diff), 'hour')
    diff = diff / 24
    return dateFormatter.format(Math.round(diff), 'day')
  }
}).mount()
