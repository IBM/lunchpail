import type Props from "./Props"

export function isHealthy(props: Props) {
  return props.spec.isJaaSWorkerHost
}

export function status(props: Props) {
  return props.metadata.annotations["codeflare.dev/status"]
}
