import { useEffect, useState } from "react"
import { Spinner } from "@patternfly/react-core"

import type { BucketItem } from "@jaas/common/api/s3"

import isError from "./error"
import { toTree } from "./Tree"
import NavBrowser, { type NavBrowserProps } from "./NavBrowser"

import "./S3Browser.scss"

export default function S3BrowserWithCreds(props: Omit<NavBrowserProps, "roots">) {
  const [loading, setLoading] = useState(true)
  const [content, setContent] = useState<BucketItem[] | { error: unknown } | null>(null)

  useEffect(() => {
    async function fetchContent() {
      try {
        const { accessKey, secretKey, endpoint, bucket, prefix } = props
        const items = await props.s3.listObjects(endpoint, accessKey, secretKey, bucket, prefix)
        setContent(items)
      } catch (error) {
        console.error("Error listing S3 objects", props, error)
        setContent({ error })
      } finally {
        setLoading(false)
      }
    }

    // TODO: polling... can we do better? add a refresh button somehow?
    fetchContent()
    const interval = setInterval(fetchContent, 5000)

    // return the cleanup function to react; it will call this on
    // component unmount
    return () => clearInterval(interval)
  }, [props.endpoint, props.accessKey, props.secretKey, props.bucket, setContent, setLoading])

  if (loading || content === null) {
    return <Spinner />
  } else if (isError(content)) {
    console.error("Error loading secrets", content)
    return "Error loading secrets: " + content.error
  } else if (content.length === 0) {
    console.log("No S3 objects found", props)
    return <span style={hasPadding}>No objects found for bucket {props.bucket}</span>
  } else {
    return (
      <NavBrowser
        roots={toTree(content, props.prefix)}
        endpoint={props.endpoint}
        accessKey={props.accessKey}
        secretKey={props.secretKey}
        bucket={props.bucket}
        s3={props.s3}
        prefix={props.prefix}
      />
    )
  }
}

/** Simulate hasPadding for DrawerTab */
const hasPadding = {
  paddingBlockStart: "var(--pf-v5-c-drawer--child--PaddingTop)",
  paddingBlockEnd: "var(--pf-v5-c-drawer--child--PaddingBottom)",
  paddingInlineStart: "var(--pf-v5-c-drawer--child--PaddingLeft)",
  paddingInlineEnd: "var(--pf-v5-c-drawer--child--PaddingRight)",
}
