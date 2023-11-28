import { useEffect, useState } from "react"

import Code from "./Code"

export default function Logs(props: { selector: string; namespace: string; follow?: boolean }) {
  const [data, setData] = useState("")

  useEffect(() => {
    setData("")

    if (window.jay.logs) {
      return window.jay.logs(props.selector, props.namespace, props.follow ?? false, (chunk) => {
        setData((data) => data + chunk)
      })
    } else {
      return
    }
  }, [props.selector, props.namespace, props.follow])

  return (
    <Code readOnly showLineNumbers={false} language="shell">
      {data}
    </Code>
  )
}
