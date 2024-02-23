import { useEffect, useState } from "react"
import untruncateJson from "untruncate-json"
import { MenuItem, Spinner, Text } from "@patternfly/react-core"

import Code from "../Code"
import Json from "../Json"

import isError from "./error"
import { filetypeFromName } from "./filetypes"

import type S3Props from "./S3Props"
import type PathPrefix from "./PathPrefix"

/**
 * Hijack a MenuItem to display content
 */
export default function ShowContent(props: S3Props & Partial<PathPrefix> & { object: string }) {
  const { s3, endpoint, accessKey, secretKey, bucket } = props

  const [loading, setLoading] = useState(true)
  const [content, setContent] = useState<string | { error: unknown } | null>(null)

  // on mount, we fetch the content
  useEffect(() => {
    async function fetch() {
      try {
        console.log("Fetching S3 content", props)
        setLoading(true)
        const content = await s3.getObject(
          endpoint,
          accessKey,
          secretKey,
          bucket,
          join(props.prefix ?? "", props.object),
        )
        console.log("Successfully fetched S3 content", props)
        setContent(content)
      } catch (error) {
        console.error("Error fetching S3 content", props, error)
        setContent({ error })
      } finally {
        setLoading(false)
      }
    }

    fetch()
  }, [props.object, endpoint, bucket, accessKey, secretKey])

  // we use the MenuItem `description` to house the view of the content
  const description =
    loading || !content ? (
      <Spinner />
    ) : isError(content) ? (
      "Error loading content: " + content.error
    ) : (
      viewContent(content, props.object)
    )

  return (
    <MenuItem
      key={props.object}
      itemId={`s3nav-content-${props.object}`}
      description={description}
      className="codeflare--no-hover codeflare--menu-item-as-content"
    ></MenuItem>
  )
}

/**
 * @return a React component to visualize the given `content` for the
 * S3 `objectName`
 */
function viewContent(content: string, objectName: string) {
  const ext = filetypeFromName(objectName)
  if (/^(makefile|tcl|markdown|verilog|synopsys|py)/i.test(ext)) {
    return (
      <Code readOnly language={ext.toLowerCase()}>
        {content}
      </Code>
    )
  } else if (/json/i.test(ext)) {
    // the Menu bits give us the padding, so we don't need extra
    // padding from the Json viewer
    try {
      return <Json readOnly>{JSON.stringify(JSON.parse(content), undefined, 2)}</Json>
    } catch (err) {
      console.error("Error parsing JSON", err)

      // try to rectify it, perhaps this is truncated JSON?
      try {
        const rectified = JSON.parse(untruncateJson(content))
        rectified["warning"] = "This object has been truncated"
        return <Json readOnly>{JSON.stringify(rectified, undefined, 2)}</Json>
      } catch (err) {
        console.error("Error trying to rectify partial JSON", err)
      }
      // intentional fall-through
    }
  }

  return <Text component="pre">{content}</Text>
}

/** path.join */
function join(a: string, b: string) {
  return [a.replace(/\/$/, ""), b].join("/")
}
