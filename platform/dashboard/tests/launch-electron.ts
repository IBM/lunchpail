import { name } from "../package.json"
import { _electron as electron } from "playwright"

function capitalize(word: string) {
  return word.charAt(0).toUpperCase() + word.slice(1)
}

export default function launchElectron() {
  const linux = `dist/linux-unpacked/${name.toLowerCase()}`
  const mac = `dist/mac-${process.arch}/${capitalize(name)}.app/Contents/MacOS/${capitalize(name)}`

  // Launch Electron app.
  return electron.launch({ executablePath: process.platform === "darwin" ? mac : linux })
}
