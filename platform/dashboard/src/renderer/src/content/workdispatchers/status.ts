import Props from "./components/Props"

export function status(props: Props["workdispatcher"]) {
  return props.metadata.annotations["lunchpail.io/status"] || "Unknown"
}
