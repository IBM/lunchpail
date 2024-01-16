import type Props from "./Props"

type Health = "Online" | "Partial" | "Offline"

export function controlplaneHealth(props: Props): Health {
  if (props.spec.jaasManager) {
    if (Object.values(props.spec.jaasManager).every(Boolean)) {
      return "Online"
    } else if (Object.values(props.spec.jaasManager).some(Boolean)) {
      return "Partial"
    }
  }

  return "Offline"
}

export function isHealthyControlPlane(props: Props): boolean {
  return controlplaneHealth(props) === "Online"
}

export function workerhostHealth(props: Props): Health {
  if (props.spec.isJaaSWorkerHost) {
    return "Online"
  }

  return "Offline"
}

export function status(props: Props) {
  return props.spec.jaasManager ? props.metadata.annotations["codeflare.dev/status"] : workerhostHealth(props)
}
