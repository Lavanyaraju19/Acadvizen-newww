const path = require('node:path')
const { spawn, spawnSync } = require('node:child_process')

const args = process.argv.slice(2)
const nextCliPath = path.join(__dirname, '..', 'node_modules', 'next', 'dist', 'bin', 'next')
const child = spawn(process.execPath, [nextCliPath, 'start', ...args], {
  stdio: 'inherit',
  windowsHide: true,
})

let shuttingDown = false

function killChildProcess() {
  if (!child.pid || shuttingDown) {
    return
  }

  shuttingDown = true

  if (process.platform === 'win32') {
    spawnSync('taskkill', ['/PID', String(child.pid), '/T', '/F'], {
      stdio: 'ignore',
      windowsHide: true,
    })
    return
  }

  child.kill('SIGTERM')
}

child.on('exit', (code, signal) => {
  process.exit(code ?? (signal ? 1 : 0))
})

child.on('error', (error) => {
  console.error(error)
  process.exit(1)
})

for (const signal of ['SIGINT', 'SIGTERM', 'SIGHUP']) {
  process.on(signal, () => {
    killChildProcess()
  })
}

process.on('exit', () => {
  killChildProcess()
})
