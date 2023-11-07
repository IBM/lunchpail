import { LinkToNewDataSet } from "./components/New/Button"

export default function Actions(settings: { inDemoMode: boolean }) {
  return !settings.inDemoMode && <LinkToNewDataSet startOrAdd="add" />
}
