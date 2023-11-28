import { Button } from "@patternfly/react-core"
import { useCallback, useEffect, useRef, useState } from "react"
import { LogViewer, LogViewerSearch } from "@patternfly/react-log-viewer"
import { Toolbar, ToolbarContent, ToolbarItem } from "@patternfly/react-core"

const searchWidth = { default: "100%" }
const searchStyle = { marginBlockStart: "var(--pf-v5-c-log-viewer__header--MarginBottom)" }

export default function Logs(props: { selector: string | string[]; namespace: string; follow?: boolean }) {
  const [data, setData] = useState("")
  const [keepBottom, setKeepBottom] = useState(false)

  const logViewerRef = useRef<{ scrollToBottom: () => void }>()

  // callback for new data from the log follower
  const onData = useCallback(
    (chunk: string) => {
      setData((data) => data + chunk)
    },
    [setData, logViewerRef],
  )

  // keep-scrolled-to-bottom effect
  useEffect(() => {
    if (keepBottom && logViewerRef.current) {
      logViewerRef.current.scrollToBottom()
    }
  }, [data, keepBottom, logViewerRef])

  // on mount, set up the log streamer
  useEffect(() => {
    // reset some state, as the props may have changed
    setData("")
    setKeepBottom(false)

    if (window.jay.logs) {
      // this starts the log streamer, and returns the cleanup function
      return window.jay.logs(props.selector, props.namespace, props.follow ?? false, onData)
    } else {
      return
    }
  }, [props.selector, props.namespace, props.follow, window.jay.logs, onData])

  // when a scroll happens, keep track of whether we want to keep-scrolled-to-bottom
  const onScroll = useCallback(
    (props: { scrollOffsetToBottom: number; scrollUpdateWasRequested: boolean }) => {
      if (props.scrollOffsetToBottom === 0) {
        // this means somehow, either via user interaction or by virtue
        // of the component, we are now scrolled to the bottom; stay
        // there
        setKeepBottom(true)
      } else if (!props.scrollUpdateWasRequested) {
        // then the user asked to scroll, so keep it where they want
        setKeepBottom(false)
      }
    },
    [setKeepBottom, logViewerRef],
  )

  const FooterButton = () => {
    const handleClick = useCallback(() => setKeepBottom(true), [])
    return <Button onClick={handleClick}>Jump to the bottom</Button>
  }

  const toolbar = (
    <Toolbar style={searchStyle}>
      <ToolbarContent>
        <ToolbarItem widths={searchWidth}>
          <LogViewerSearch placeholder="Search value" minSearchChars={1} />
        </ToolbarItem>
      </ToolbarContent>
    </Toolbar>
  )

  return (
    <LogViewer
      data={data}
      theme="dark"
      height={keepBottom ? "510px" : "470px"}
      hasLineNumbers={false}
      toolbar={toolbar}
      ref={logViewerRef}
      onScroll={onScroll}
      footer={!keepBottom && <FooterButton />}
    />
  )
}
