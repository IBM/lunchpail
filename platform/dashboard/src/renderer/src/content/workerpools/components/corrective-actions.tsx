import type Props from "./Props"
import { LinkToNewRepoSecret } from "@jay/renderer/navigate/newreposecret"

/** Any suggestions/corrective action buttons */
export default function correctiveActions(props: Props, startOrAdd: "fix" | "create" = "fix") {
  const latestStatus = props.status
  const status = latestStatus?.metadata.annotations["codeflare.dev/status"]
  const reason = latestStatus?.metadata.annotations["codeflare.dev/reason"]
  const message = latestStatus?.metadata.annotations["codeflare.dev/message"]
  if (status === "CloneFailed" && reason === "AccessDenied") {
    const repoMatch = message?.match(/(https:\/\/[^/]+)/)
    const repo = repoMatch ? repoMatch[1] : undefined
    return [
      <LinkToNewRepoSecret key="newreposecret" repo={repo} namespace={props.model.namespace} startOrAdd={startOrAdd} />,
    ]
  } else {
    return []
  }
}
