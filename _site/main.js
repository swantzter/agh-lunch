import { createApp } from 'https://unpkg.com/petite-vue?module'

const dateFormatter = new Intl.RelativeTimeFormat(['sv-SE', 'sv', 'en-SE', 'en-GB', 'en'], { style: 'short', numeric: 'auto' })
const autoplayTime = 20_000
const fetchTime = 1000 * 60 * 60 // 1h

createApp({
  /** @type {number} */
  now: Date.now(),
  /** @type {number} */
  lastChange: -Infinity,
  /** @type {number} */
  lastFetch: -Infinity,
  loadDay: new Date().getDate(),
  /** @type {boolean} */
  autoPlay: true,

  /** @type {Promise<any> | null} */
  ongoingFetch: null,
  /** @type {number | null} */
  currentRestaurantId: null,
  restaurants: [],

  get menuRestaurants () {
    return this.restaurants.filter(r => r.files != null && r.files.length > 0)
  },
  get listRestaurants () {
    return this.restaurants.filter(r => r.files == null || r.files.length === 0)
  },
  get currentRestaurant () {
    return this.restaurants.find(r => r.id === this.currentRestaurantId)
  },
  get switchProgress () {
    return `${Math.round((1 - (Math.abs(this.now - this.lastChange) / autoplayTime)) * 100)}%`
  },

  mounted () {
    this.fetchRestaurants()
    this.startTimers()
  },

  startTimers () {
    setInterval(() => {
      // This makes displayed dates and such update
      this.now = Date.now()

      // Change the currently displayed menu on an interval
      if (
        Math.abs(this.now - this.lastChange) > autoplayTime &&
        this.menuRestaurants.length > 0 &&
        this.autoPlay === true
      ) {
        this.nextRestaurant()
      }

      // Reload the page once per day to get any new code updates
      if (this.loadDay !== new Date().getDate()) {
        window.location.reload()
      }

      // Refetch the list of restaurants every now and then
      if (Math.abs(this.now - this.lastChange) > fetchTime) {
        this.fetchRestaurants()
      }
    }, 1_000)
  },
  async fetchRestaurants () {
    if (this.ongoingFetch != null) return
    try {
      this.ongoingFetch = fetch('/restaurants.json', { headers: { accept: 'application/json' } })
      const res = await this.ongoingFetch
      if (res.ok !== true) console.error('Failed to fetch restaurants manifest')
      const restaurants = await res.json()
      restaurants.sort((a, b) => a.name.localeCompare(b.name))

      this.restaurants = restaurants
      this.lastFetch = Date.now()

      if (this.autoPlay === true || this.restaurants.find(r => r.id === this.currentRestaurantId) == null) {
        this.nextRestaurant()
      }
    } finally {
      this.ongoingFetch = null
    }
  },
  nextRestaurant () {
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
  toggleAutoPlay () {
    if (this.autoPlay === true) this.nextRestaurant()
    // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
    this.autoPlay = !this.autoPlay
  },

  /** @param {string} date */
  formatDate (date) {
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
