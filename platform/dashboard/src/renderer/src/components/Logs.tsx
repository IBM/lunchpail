import { Button } from "@patternfly/react-core"
import { useCallback, useEffect, useRef, useState } from "react"
import { LogViewer, LogViewerSearch } from "@patternfly/react-log-viewer"
import { Toolbar, ToolbarContent, ToolbarItem } from "@patternfly/react-core"

const searchWidth = { default: "100%" }
const searchStyle = { marginBlockStart: "var(--pf-v5-c-log-viewer__header--MarginBottom)" }

export default function Logs(props: { selector: string | string[]; namespace: string; follow?: boolean }) {
  const [data, setData] = useState("")

  // on mount, set up the log streamer
  useEffect(() => {
    // reset data, in case ths props have changed
    setData("")

    if (window.jay.logs) {
      return window.jay.logs(props.selector, props.namespace, props.follow ?? false, (chunk) => {
        setData((data) => data + chunk)
      })
    } else {
      return
    }
  }, [props.selector, props.namespace, props.follow])

  const logViewerRef = useRef<{ scrollToBottom: () => void }>()

  const FooterButton = () => {
    const handleClick = useCallback(() => {
      if (logViewerRef.current) {
        logViewerRef.current.scrollToBottom()
      }
    }, [logViewerRef])
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
      height="480px"
      hasLineNumbers={false}
      toolbar={toolbar}
      ref={logViewerRef}
      footer={<FooterButton />}
    />
  )
}
