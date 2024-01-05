import { name } from "../package.json"
import { _electron as electron } from "playwright"

function capitalize(word: string) {
  return word.charAt(0).toUpperCase() + word.slice(1)
}

export default async function launchElectron() {
  const linux = `dist/linux-unpacked/${name.toLowerCase()}`
  const mac = `dist/mac-${process.arch}/${capitalize(name)}.app/Contents/MacOS/${capitalize(name)}`

  // Launch Electron app.
  const app = await electron.launch({ executablePath: process.platform === "darwin" ? mac : linux })
  const page = await app.firstWindow()

  // Listen for all console logs
  page.on("console", (msg) => console.log("Electron:: " + msg.text()))

  // clear local/session storage between tests
  if (process.env.CI) {
    await page.evaluate(() => {
      console.error("Clearing state")
      window.localStorage.clear()
      window.sessionStorage.clear()
    })
  }

  // re-emit main process logs
  const outputMsg = app.process().stdout
  outputMsg != null && outputMsg.pipe(process.stdout)

  const errMsg = app.process().stderr
  errMsg != null && errMsg.pipe(process.stderr)

  return app
}
