const path = require('node:path')
const { spawn } = require('node:child_process')
const http = require('node:http')
const https = require('node:https')

const DEFAULT_BASE_URL = 'http://127.0.0.1:3200'
const READY_TIMEOUT_MS = 120000
const READY_POLL_MS = 500

function parseBaseUrl(baseUrl) {
  const parsed = new URL(baseUrl)
  return {
    baseUrl: parsed.toString().replace(/\/$/, ''),
    hostname: parsed.hostname || '127.0.0.1',
    port: parsed.port || (parsed.protocol === 'https:' ? '443' : '80'),
  }
}

function createBaseEnv() {
  const parsed = parseBaseUrl(process.env.E2E_BASE_URL || DEFAULT_BASE_URL)
  return {
    ...process.env,
    E2E_BASE_URL: parsed.baseUrl,
  }
}

function requestUrl(url) {
  return new Promise((resolve, reject) => {
    const transport = url.startsWith('https:') ? https : http
    const req = transport.get(url, (response) => {
      const { statusCode = 0 } = response
      response.resume()
      resolve(statusCode)
    })

    req.on('error', reject)
    req.setTimeout(5000, () => {
      req.destroy(new Error(`Timed out requesting ${url}`))
    })
  })
}

async function waitForServer(url, timeoutMs) {
  const startedAt = Date.now()

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const statusCode = await requestUrl(url)
      if (statusCode >= 200 && statusCode < 400) {
        return
      }
    } catch {
      // keep polling until the deadline
    }

    await new Promise((resolve) => setTimeout(resolve, READY_POLL_MS))
  }

  throw new Error(`Timed out waiting for ${url}`)
}

function killChild(child) {
  if (!child?.pid) {
    return Promise.resolve()
  }

  return new Promise((resolve) => {
    const onExit = () => resolve()
    child.once('exit', onExit)

    if (process.platform === 'win32') {
      const killer = spawn('taskkill', ['/PID', String(child.pid), '/T', '/F'], {
        stdio: 'ignore',
        windowsHide: true,
      })
      killer.once('exit', () => resolve())
      killer.once('error', () => resolve())
      return
    }

    child.kill('SIGTERM')
    setTimeout(resolve, 5000).unref()
  })
}

async function main() {
  const baseEnv = createBaseEnv()
  const parsedBaseUrl = parseBaseUrl(baseEnv.E2E_BASE_URL)
  const readyUrl = new URL('/api/health', baseEnv.E2E_BASE_URL).toString()
  const serverScriptPath = path.join(__dirname, 'playwright-webserver.cjs')
  const playwrightCliPath = require.resolve('@playwright/test/cli')
  const serverArgs = [serverScriptPath, '--hostname', parsedBaseUrl.hostname, '--port', parsedBaseUrl.port]

  const serverProcess = spawn(process.execPath, serverArgs, {
    cwd: path.join(__dirname, '..'),
    env: baseEnv,
    stdio: 'inherit',
    windowsHide: true,
  })

  let shuttingDown = false

  async function shutdown() {
    if (shuttingDown) {
      return
    }

    shuttingDown = true
    await killChild(serverProcess)
  }

  for (const signal of ['SIGINT', 'SIGTERM']) {
    process.on(signal, async () => {
      await shutdown()
      process.exit(1)
    })
  }

  serverProcess.once('exit', (code) => {
    if (!shuttingDown && code !== 0) {
      process.exit(code ?? 1)
    }
  })

  try {
    await waitForServer(readyUrl, READY_TIMEOUT_MS)
    const playwrightArgs = process.argv.slice(2)
    const playwrightProcess = spawn(process.execPath, [playwrightCliPath, 'test', ...playwrightArgs], {
      cwd: path.join(__dirname, '..'),
      env: baseEnv,
      stdio: 'inherit',
      windowsHide: true,
    })

    const exitCode = await new Promise((resolve, reject) => {
      playwrightProcess.once('exit', (code) => resolve(code ?? 1))
      playwrightProcess.once('error', reject)
    })

    await shutdown()
    process.exit(exitCode)
  } catch (error) {
    console.error(error instanceof Error ? error.message : error)
    await shutdown()
    process.exit(1)
  }
}

main()
