import { omit } from '@dword-design/functions'
import nuxtDevServer from '@dword-design/nuxt-dev-server'
import { loadNuxt } from '@nuxt/kit'
import { execaCommand } from 'execa'
import { build } from 'nuxt'
import { pEvent } from 'p-event'
import kill from 'tree-kill-promise'

export default class Nuxt {
  constructor(config = {}) {
    this.dev = config.dev
    this.config = config |> omit(['dev'])
  }

  async build() {
    if (!this.dev) {
      this.nuxt = await loadNuxt({ config: this.config })
      await build(this.nuxt)
    }
  }

  async listen() {
    if (this.dev) {
      this.devServer = await nuxtDevServer({ config: this.config })
    } else {
      this.childProcess = execaCommand('nuxt start', { all: true })
      await pEvent(
        this.childProcess.all,
        'data',
        data => data.toString() === 'Listening http://[::]:3000\n'
      )
    }
  }

  async close() {
    if (this.dev) {
      await this.devServer.close()
    } else {
      await kill(this.childProcess.pid)
    }
  }
}
