import Props from "./components/Props"

export function status(props: Props["workdispatcher"]) {
  return props.metadata.annotations["codeflare.dev/status"] || "Unknown"
}

export function message(props: Props["workdispatcher"]) {
  return props.metadata.annotations["codeflare.dev/message"]
}