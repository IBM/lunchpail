import { LinkToNewComputeTarget } from "./components/New/Button"

export default function Actions(settings: { inDemoMode: boolean }) {
  return !settings.inDemoMode && <LinkToNewComputeTarget startOrAdd="add" />
}
