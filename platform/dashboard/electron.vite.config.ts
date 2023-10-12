import { resolve } from "path"
import { defineConfig, externalizeDepsPlugin } from "electron-vite"
import react from "@vitejs/plugin-react"
import checker from "vite-plugin-checker"

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
  },
  renderer: {
    resolve: {
      alias: {
        "@renderer": resolve("src/renderer/src"),
      },
    },
    plugins: [
      react(),
      checker({
        typescript: {
          // this tells vite-plugin-checker to support "composite"
          // projects, which is the case for our ./tsconfig.json
          buildMode: true,
        },
      }),
    ],
  },
})
