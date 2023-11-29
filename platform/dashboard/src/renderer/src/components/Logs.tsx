import { useEffect, useMemo, useRef } from "react"

import { Terminal, type ITheme } from "xterm"
import { FitAddon } from "xterm-addon-fit"
import { WebglAddon } from "xterm-addon-webgl"

import "xterm/css/xterm.css"

const style = { flex: 1, display: "flex" as const, fontFamily: "RedHatMono" }

export default function Logs(props: { selector: string; namespace: string; follow?: boolean }) {
  const ref = useRef<HTMLDivElement>(null)

  const theme = useMemo(() => {
    const body = document.querySelector("body")
    if (body) {
      const style = getComputedStyle(body)
      const val = (s: string) => style.getPropertyValue(`--pf-v5-global--${s}`)

      const theme: ITheme = {
        background: val("BackgroundColor--dark-100"),
        black: val("palette--black-1000"),
        blue: val("palette--blue-200"),
        brightBlack: val("palette--black-800"),
        brightBlue: val("palette--blue-100"),
        brightCyan: val("palette--cyan-100"),
        brightGreen: val("palette--light-green-200"),
        brightMagenta: val("palette--purple-100"),
        brightRed: val("palette--red-100"),
        brightWhite: val("palette--white"),
        brightYellow: val("palette--gold-100"),
        cursor: val("palette--blue-100"),
        cursorAccent: val("palette--blue-200"),
        cyan: val("palette--cyan-200"),
        foreground: val("ForegroundColor--dark-100"),
        green: val("palette--green-200"),
        magenta: val("palette--purple-200"),
        red: val("palette--red-200"),
        selectionBackground: val("palette--black-700"),
        selectionForeground: val("palette--white"),
        selectionInactiveBackground: "var(--pf-v5-global--BackgroundColor--dark-100)",
        white: val("palette--white"),
        yellow: val("palette--gold-200"),
      }
      return theme
    } else {
      return {}
    }
  }, [])

  useEffect(() => {
    if (window.jay.logs) {
      const terminal = new Terminal({
        fontSize: 14,
        theme,
      })
      const fitAddon = new FitAddon()
      const webgl = new WebglAddon()
      terminal.loadAddon(fitAddon)

      if (ref.current) {
        terminal.open(ref.current)

        terminal.loadAddon(webgl)
        webgl.onContextLoss(() => {
          webgl.dispose()
        })

        fitAddon.fit()
      }

      // callback for new data from the log follower
      const onData = (chunk: string) => {
        terminal.write(chunk + "\r")
        terminal.scrollToBottom()
      }

      const cleanups = [
        () => webgl.dispose(),
        () => terminal.dispose(),
        window.jay.logs(props.selector, props.namespace, props.follow ?? false, onData),
        // ^^^ this starts the log streamer, and returns the cleanup function
      ]

      return () => cleanups.forEach((_) => _())
    } else {
      return
    }
  }, [props.selector, props.namespace, props.follow, window.jay.logs])

  return <div ref={ref} style={style} />
}
