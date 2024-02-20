import { useContext, useEffect, useMemo, useRef } from "react"

import DrawerMaximizedContext from "@jaas/components/Drawer/Maximized"

import { Terminal, type ITheme } from "xterm"
import { FitAddon } from "xterm-addon-fit"
import { WebglAddon } from "xterm-addon-webgl"

import "xterm/css/xterm.css"
import "./Logs.css"

const style = { flex: 1, display: "flex" as const, fontFamily: "RedHatMono" }

/** @return a Patternfly-ish `Terminal.ITheme` */
function theme(): ITheme {
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
}

/**
 * A React Component that displays the logs for the given resources in
 * the given namespace
 */
export default function Logs(props: { selector: string; namespace: string; follow?: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  const isMaximized = useContext(DrawerMaximizedContext)

  // memoize this, so we aren't creating a new instance on every
  // render; we will need this to help with resizing on
  // maximize/restore of the Drawer
  const fitAddon = useMemo(() => new FitAddon(), [])

  // when the Drawer maximization state changes, re-fit the Terminal
  useEffect(() => {
    setTimeout(() => fitAddon.fit(), 200)
  }, [isMaximized])

  useEffect(() => {
    if (window.jaas.logs) {
      const terminal = new Terminal({
        theme: theme(),
        fontSize: 14,
        disableStdin: true,
      })
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
      let to: null | ReturnType<typeof setTimeout> = null
      let lastFlush = Date.now()
      let pending = ""
      const flush = () => {
        lastFlush = Date.now()
        terminal.write(pending)

        // auto-scroll to bottom if the current viewport is the "last page"
        const currentScrollBottom = terminal.buffer.active.viewportY + terminal.rows
        const isScrolledToEnd = currentScrollBottom === terminal.buffer.active.length
        if (isScrolledToEnd) {
          // seems a bit strange to do this if we are already
          // `isScrolledToEnd`, but the `isScrolledToEnd` reflects the
          // situation *before* the `terminal.write()` has taken
          // effect
          terminal.scrollToBottom()
        }
      }
      const onData = (chunk: string) => {
        pending += chunk + "\r"
        if (Date.now() - lastFlush > 200) {
          if (to) clearTimeout(to)
          flush()
        } else {
          if (to) clearTimeout(to)
          to = setTimeout(flush, 10)
        }
      }

      const cleanups = [
        () => webgl.dispose(),
        () => terminal.dispose(),
        window.jaas.logs(props.selector, props.namespace, props.follow ?? false, onData),
        // ^^^ this starts the log streamer, and returns the cleanup function
      ]

      return () => cleanups.forEach((_) => _())
    } else {
      return
    }
  }, [props.selector, props.namespace, props.follow, window.jaas.logs, ref.current])

  return <div ref={ref} style={style} />
}
