import * as pkgJson from './package.json'
import * as pkgLock from './package-lock.json'
import { type Response } from 'undici'
import { createWriteStream } from 'node:fs'
import * as path from 'node:path'
import { finished } from 'node:stream/promises'
import { Readable } from 'node:stream'

export interface RestaurantInfo {
  id: string
  name: string
  updatedAt?: Date
  files?: MenuFile[]
}

export interface MenuFile {
  type: 'pdf' | 'image' | 'html'
  src: string
}

export class FetchError extends Error {
  status: number
  body: string

  constructor (url: string, status: number, body: string) {
    super(`Got bad response when fetching ${url}`)
    this.name = 'FetchError'
    this.status = status
    this.body = body
  }
}

export class DataError extends Error {
  data: any

  constructor (message: string, url: string, data: any) {
    super(`Got bad response when fetching ${url}`)
    this.name = 'DataError'
    this.data = data
  }
}

export function getUserAgent () {
  return `undici/${pkgLock.packages['node_modules/undici'].version} ${pkgJson.name}/${pkgJson.version} (svante@swantzter.se)`
}

export async function saveFile (res: Response, name: string) {
  const ws = createWriteStream(path.join(__dirname, 'dist/assets', name), { flags: 'w' })
  if (res.body == null) throw new TypeError('Body is missing from response')
  await finished(Readable.fromWeb(res.body).pipe(ws))
}
