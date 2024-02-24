import { useEffect, useState } from "react"
import { Spinner } from "@patternfly/react-core"

import type PathPrefix from "./PathPrefix"
import type DataSetEvent from "@jaas/common/events/DataSetEvent"
import type { KubernetesS3Secret } from "@jaas/common/events/KubernetesResource"

import S3BrowserWithCreds from "."

/**
 * A React component that presents a `<NavBrowser/>` after loading the
 * `Tree` model. This component will manage fetching the S3
 * credentials associated with the given `DataSet`, and then pass them
 * to `<S3BrowserWithCreds/>`.
 */
export default function S3BrowserThatFetchesCreds(
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
