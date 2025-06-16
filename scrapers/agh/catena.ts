import { DataError, FetchError, type RestaurantInfo, getUserAgent, saveFile, type MenuFile } from '../../helpers.js'
import { fetch } from 'undici'

interface LinkedImage {
  id: string
  src: string
}

interface BaseSiteSection {
  id: string
  type: string
  createdAt: string
  updatedAt: string
}
interface LinkedImagesSiteSection extends BaseSiteSection {
  type: 'LINKED IMAGES'
  config: {
    bgSettings: string
    linkedImages?: LinkedImage[]
  }
}
type SiteSection = BaseSiteSection | LinkedImagesSiteSection

interface PageData {
  id: string
  name: string
  siteSections: SiteSection[]
}

function isPageData (x: unknown): x is PageData {
  return typeof x === 'object' && x != null && 'siteSections' in x
}

interface RenderedImage {
  url: string
  alt: string
  srcset: string
  urlImgOriginalProportion: string
}

function isRenderedImage (x: unknown): x is RenderedImage {
  return typeof x === 'object' && x != null && 'url' in x
}

export const info: RestaurantInfo = { id: 'catena', name: 'Catena Arena', autoplayDuration: 10_000 }

export default async function scrape (): Promise<MenuFile[]> {
  const baseUrl = 'https://www.roglebk.se'
  // the UUID here is the page/CMS id for the lunch page
  const res = await fetch(new URL('/api/layouts/site-layouts/2141f64a-42fe-478a-a3e7-f6ee906a4bf5', baseUrl), {
    headers: {
      accept: 'application/json',
      'cache-control': 'no-cache',
      'user-agent': getUserAgent(),
    },
  })
  if (!res.ok) throw new FetchError(res.url, res.status, await res.text())

  const pageData = await res.json()
  if (!isPageData(pageData)) throw new DataError('Response is not page data', res.url, pageData)
  const section = pageData.siteSections.findLast(sec => sec.type === 'LINKED IMAGES') as LinkedImagesSiteSection | undefined
  if (section == null) throw new DataError('response is missing linked images section', res.url, pageData)
  const images = []
  for (const image of section.config.linkedImages ?? []) {
    images.push(image.src)
  }

  const files: MenuFile[] = []

  await Promise.all(images.map(async (src, idx) => {
    const url = new URL('/api/media/render', baseUrl)
    url.searchParams.append('mediaString', src)
    url.searchParams.append('isCroppingEnabled', 'false')
    const renderRes = await fetch(url, {
      headers: {
        accept: 'application/json',
        'user-agent': getUserAgent(),
      },
    })
    if (!res.ok) throw new FetchError(renderRes.url, renderRes.status, await renderRes.text())

    const rendered = await renderRes.json()
    if (!isRenderedImage(rendered)) throw new DataError('Response is not rendered Image', renderRes.url, rendered)

    const imgRes = await fetch(rendered.url, {
      headers: {
        accept: 'image/*',
        'user-agent': getUserAgent(),
      },
    })
    if (!imgRes.ok) throw new FetchError(imgRes.url, imgRes.status, await imgRes.text())

    await saveFile(imgRes, `catena-${idx + 1}.jpg`)

    files.push({ type: 'image', src: `/assets/catena-${idx + 1}.jpg` })
  }))

  return files
}
