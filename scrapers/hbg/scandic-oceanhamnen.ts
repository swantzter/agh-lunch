import { type RestaurantInfo } from '../../helpers.js'

export const info: RestaurantInfo = { id: 'scandic-oceanhamnen', name: 'Scandic Oceanhamnen', href: 'https://www.scandichotels.com/sv/hotell/scandic-oceanhamnen/restaurang' }

// export default async function scrape (): Promise<MenuFile[]> {
//   const baseUrl = 'https://www.scandichotels.com/sv/hotell/scandic-oceanhamnen/restaurang'
//   const res = await fetch(baseUrl, {
//     headers: {
//       accept: 'text/html',
//       'cache-control': 'no-cache',
//       'user-agent': getUserAgent(),
//     },
//   })
//   if (!res.ok) throw new FetchError(res.url, res.status, await res.text())

//   const body = await res.text()
//   const $ = cheerio.load(body)

//   const menuHref = $('aside a:contains(Lunch)').attr('href')
//   console.log(menuHref)
//   if (menuHref == null) throw new DataError('Could not find link to menu', res.url, body)

//   const pdfRes = await fetch(new URL(menuHref, baseUrl), {
//     headers: {
//       accept: 'application/pdf',
//       // IIS servers' deflate responses crashes node zlib
//       'accept-encoding': 'identity',
//       'cache-control': 'no-cache',
//       'user-agent': getUserAgent(),
//     },
//   })

//   if (!pdfRes.ok) throw new FetchError(pdfRes.url, pdfRes.status, await pdfRes.text())

//   const pages = await savePdfImg(pdfRes, 'hus57')

//   return pages.map(p => ({
//     type: 'image',
//     src: `/${path.relative(path.resolve(import.meta.dirname, '../_site'), p.path)}`,
//   }))
// }
