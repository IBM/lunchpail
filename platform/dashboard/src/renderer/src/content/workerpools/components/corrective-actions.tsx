import type KubernetesResource from "@jay/common/events/KubernetesResource"
import { LinkToNewRepoSecret } from "@jay/renderer/navigate/newreposecret"

/** Any suggestions/corrective action buttons */
export default function correctiveActions(rsrc: KubernetesResource, startOrAdd: "fix" | "create" = "fix") {
  const status = rsrc.metadata.annotations["codeflare.dev/status"]
  const reason = rsrc.metadata.annotations["codeflare.dev/reason"]
  const message = rsrc.metadata.annotations["codeflare.dev/message"]
  if (status === "CloneFailed" && reason === "AccessDenied") {
    const repoMatch = message?.match(/(https:\/\/[^/]+)/)
    const repo = repoMatch ? repoMatch[1] : undefined
    return [
      <LinkToNewRepoSecret
        key="newreposecret"
        repo={repo}
        namespace={rsrc.metadata.namespace}
        startOrAdd={startOrAdd}
      />,
    ]
  } else {
    return []
  }
}
