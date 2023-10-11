declare global {
  interface Window {
    jaas: typeof import("../main/events")
  }
}
