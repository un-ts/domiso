import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { sanitize, sanitizeSvg } from 'domiso'

const fixtures = path.resolve(fileURLToPath(import.meta.url), '../fixtures')

describe('fixtures', () => {
  test('html', async () => {
    const htmlFixtures = path.resolve(fixtures, 'html')
    const files = await fs.readdir(htmlFixtures)
    for (const file of files) {
      expect(
        sanitize(await fs.readFile(path.resolve(htmlFixtures, file), 'utf8')),
      ).toMatchSnapshot()
    }
  })

  test('svg', async () => {
    const svgFixtures = path.resolve(fixtures, 'svg')
    const files = await fs.readdir(svgFixtures)
    for (const file of files) {
      expect(
        sanitizeSvg(await fs.readFile(path.resolve(svgFixtures, file), 'utf8')),
      ).toMatchSnapshot()
    }
  })
})
