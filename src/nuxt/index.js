import { omit } from '@dword-design/functions'
import nuxtDevServer from '@dword-design/nuxt-dev-server'
import packageName from 'depcheck-package-name'
import { execaCommand } from 'execa'
import { pEvent } from 'p-event'
import kill from 'tree-kill-promise'

export default class Nuxt {
  constructor(config = {}) {
    this.dev = config.dev
    this.config = config |> omit(['dev'])
  }

  async build() {
    if (!this.dev) {
      /**
       * For some reason Nuxt decides from the environment if it is in dev mode. Also, the passed config value
       * of dev doesn't seem to be taken into account. This is why we have to import Nuxt late so that the
       * environment variable is already correct
       *
       * Definition of dev variable: https://github.com/nuxt/nuxt/blob/main/packages/schema/src/config/common.ts#L147
       * applyDefaults: https://github.com/nuxt/nuxt/blob/main/packages/kit/src/loader/config.ts#L53
       */

      const nuxtKit = await import(packageName`@nuxt/kit`)
      this.nuxt = await nuxtKit.loadNuxt({ config: this.config })
      await nuxtKit.buildNuxt(this.nuxt)
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
