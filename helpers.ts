import * as pkgJson from './package.json'
import * as pkgLock from './package-lock.json'
import { type Response } from 'undici'
import { createWriteStream } from 'node:fs'
import * as path from 'node:path'
import { finished } from 'node:stream/promises'
import { Readable } from 'node:stream'
import { writeFile } from 'node:fs/promises'
import { pdfToPng } from 'pdf-to-png-converter'

export interface RestaurantInfo {
  id: string
  name: string
  updatedAt?: Date
  files?: MenuFile[]
  autoplayDuration?: number
}

export interface MenuFile {
  type: 'image' | 'html'
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
  return `undici/${pkgLock.packages['node_modules/undici'].version} ${pkgJson.name}/${pkgJson.version} (lunch@swantzter.se)`
}

export async function saveFile (res: Response, name: string) {
  const ws = createWriteStream(path.join(__dirname, '_site/assets', name), { flags: 'w' })
  if (res.body == null) throw new TypeError('Body is missing from response')
  await finished(Readable.fromWeb(res.body).pipe(ws))
}

export async function savePdfImg (res: Response, name: string) {
  const buf = Buffer.from(await res.arrayBuffer())
  const pages = await pdfToPng(buf, {
    outputFolder: '_site/assets',
    outputFileMask: name
  })
  return pages
}

const preamble = `<!DOCTYPE html>
<html lang="sv">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'self'; style-src 'self' 'unsafe-inline';">
</head>
<body>`

export async function saveHtml (html: string, name: string) {
  await writeFile(path.join(__dirname, '_site/assets', name), `${preamble}${html}`, 'utf-8')
}
