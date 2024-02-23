import { useEffect, useState } from "react"
import { Spinner } from "@patternfly/react-core"

import type { BucketItem } from "@jaas/common/api/s3"
import type DataSetEvent from "@jaas/common/events/DataSetEvent"
import type TaskQueueEvent from "@jaas/common/events/TaskQueueEvent"
import type { KubernetesS3Secret } from "@jaas/common/events/KubernetesResource"

import type PathPrefix from "./PathPrefix"

import isError from "./error"
import { toTree } from "./Tree"
import NavBrowser, { type NavBrowserProps } from "./NavBrowser"

import "./S3Browser.scss"

/**
 * A React component that presents a `<NavBrowser/>` after loading the
 * `Tree` model. This component will manage fetching the S3
 * credentials associated with the given `DataSet`, and then pass them
 * to `<S3BrowserWithCreds/>`.
 */
function S3Browser(
  props: DataSetEvent["spec"]["local"] & Pick<Required<typeof window.jaas>, "get" | "s3"> & Partial<PathPrefix>,
) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<unknown | null>(null)
  const [secret, setSecret] = useState<null | { accessKey: string; secretKey: string }>(null)

  useEffect(() => {
    async function fetchCredentials() {
      try {
        const secret = await props.get<KubernetesS3Secret>({
          kind: "secret",
          name: props["secret-name"],
          namespace: props["secret-namespace"],
        })

        const accessKey = atob(secret.data.accessKeyID)
        const secretKey = atob(secret.data.secretAccessKey)
        setSecret({ accessKey, secretKey })
      } catch (error) {
        console.error("Error fetching S3 credentials", props, error)
        setError(error)
      }

      setLoading(false)
    }

    fetchCredentials()
  }, [props["secret-name"], props["secret-namespace"]])

  if (loading || secret === null) {
    return <Spinner />
  } else if (error) {
    return "Error loading secrets: " + error
  } else {
    return (
      <S3BrowserWithCreds
        {...secret}
        endpoint={props.endpoint}
        bucket={props.bucket}
        s3={props.s3}
        prefix={props.prefix}
      />
    )
  }
}

export function S3BrowserWithCreds(props: Omit<NavBrowserProps, "roots">) {
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

import DrawerTab from "@jaas/components/Drawer/Tab"

/** A Drawer tab that shows <S3Browser /> */
export function BrowserTabs(
  props: (DataSetEvent | TaskQueueEvent)["spec"]["local"] & Partial<PathPrefix> & { title?: string },
) {
  if (window.jaas.get && window.jaas.s3) {
    return DrawerTab({
      hasNoPadding: true,
      title: props.title ?? "Browser",
      body: <S3Browser {...props} get={window.jaas.get} s3={window.jaas.s3} />,
    })
  } else {
    return undefined
  }
}
