// import * as pkgJson from './package.json'
// import * as pkgLock from './package-lock.json'
import { type Response } from 'undici'
import { createWriteStream } from 'node:fs'
import * as path from 'node:path'
import { finished } from 'node:stream/promises'
import { Readable } from 'node:stream'
import { writeFile, readFile } from 'node:fs/promises'
import { pdfToPng } from 'pdf-to-png-converter'

export interface MenuFile {
  type: 'image' | 'html'
  src: string
}

export interface RestaurantInfo {
  id: string
  name: string
  updatedAt?: Date
  files?: MenuFile[]
  autoplayDuration?: number
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
  data: unknown

  constructor (message: string, url: string, data: unknown) {
    super(`Got bad data from ${url} (${message})`)
    this.name = 'DataError'
    this.data = data
  }
}

const pkgJson = await readFile(path.join(import.meta.dirname, 'package.json'), 'utf-8').then(str => JSON.parse(str) as Record<'name' | 'version', string>)
const pkgLock = await readFile(path.join(import.meta.dirname, 'package-lock.json'), 'utf-8').then(str => JSON.parse(str) as { packages: Record<string, { version: string }> })
export function getUserAgent () {
  return `undici/${pkgLock.packages['node_modules/undici'].version} ${pkgJson.name}/${pkgJson.version} (lunch@swantzter.se)`
}

export async function saveFile (res: Response, name: string) {
  const ws = createWriteStream(path.join(import.meta.dirname, '_site/assets', name), { flags: 'w' })
  if (res.body == null) throw new TypeError('Body is missing from response')
  await finished(Readable.fromWeb(res.body).pipe(ws))
}

export async function savePdfImg (res: Response, name: string) {
  const buf = await res.arrayBuffer()
  const pages = await pdfToPng(buf, {
    outputFolder: '_site/assets',
    outputFileMaskFunc: () => name,
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
  await writeFile(path.join(import.meta.dirname, '_site/assets', name), `${preamble}${html}`, 'utf-8')
}
