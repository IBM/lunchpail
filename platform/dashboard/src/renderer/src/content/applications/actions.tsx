import { LinkToNewApplication } from "./components/New/Button"

export default function Actions(settings: { inDemoMode: boolean }) {
  return !settings.inDemoMode && <LinkToNewApplication startOrAdd="add" />
}
