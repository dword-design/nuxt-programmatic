import { endent } from '@dword-design/functions'
import tester from '@dword-design/tester'
import testerPluginPuppeteer from '@dword-design/tester-plugin-puppeteer'
import testerPluginTmpDir from '@dword-design/tester-plugin-tmp-dir'
import fs from 'fs-extra'
import outputFiles from 'output-files'
import P from 'path'

import Self from './index.js'

export default tester(
  {
    async 'dev server'() {
      await outputFiles({
        'package.json': JSON.stringify({ type: 'module' }),
        'pages/index.vue': endent`
      <template>
        <div class="foo" />
      </template>
    `,
      })

      const nuxt = new Self({
        dev: true,
        modules: [() => fs.outputFile('foo.txt', '')],
        telemetry: false,
      })
      await nuxt.build()
      await nuxt.listen()
      try {
        expect(await fs.exists('foo.txt')).toEqual(true)
        await this.page.goto('http://localhost:3000')
        await this.page.waitForSelector('.foo')
        await fs.outputFile(
          P.join('pages', 'index.vue'),
          endent`
            <template>
              <div class="bar" />
            </template>
          `
        )
        await this.page.waitForSelector('.bar')
      } finally {
        await nuxt.close()
      }
    },
    async prod() {
      await outputFiles({
        'package.json': JSON.stringify({ type: 'module' }),
        'pages/index.vue': endent`
          <template>
            <div class="foo" />
          </template>
        `,
      })

      const nuxt = new Self({
        modules: [() => fs.outputFile('foo.txt', '')],
        telemetry: false,
        vite: { logLevel: 'error' },
      })
      await nuxt.build()
      await nuxt.listen()
      try {
        expect(await fs.exists('foo.txt')).toEqual(true)
        await this.page.goto('http://localhost:3000')
        await this.page.waitForSelector('.foo')
        await fs.outputFile(
          P.join('pages', 'index.vue'),
          endent`
            <template>
              <div class="bar" />
            </template>
          `
        )
      } finally {
        await nuxt.close()
      }
    },
  },
  [testerPluginTmpDir(), testerPluginPuppeteer()]
)
