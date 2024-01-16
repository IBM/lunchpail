import type Props from "./Props"

type Health = "online" | "partial" | "offline"

export function controlplaneHealth(props: Props): Health {
  if (props.spec.jaasManager) {
    if (Object.values(props.spec.jaasManager).every(Boolean)) {
      return "online"
    } else if (Object.values(props.spec.jaasManager).some(Boolean)) {
      return "partial"
    }
  }

  return "offline"
}

export function isHealthyControlPlane(props: Props): boolean {
  return controlplaneHealth(props) === "online"
}

export function workerhostHealth(props: Props): Health {
  if (props.spec.isJaaSWorkerHost) {
    return "online"
  }

  return "offline"
}

export function status(props: Props) {
  return props.metadata.annotations["codeflare.dev/status"]
}
