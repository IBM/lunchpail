export type JaaSApi = {
  on(source: "datasets" | "queues" | "pools" | "applications", cb: (...args: unknown[]) => void): void

  isLaptopReady(): Promise<void>

  makeLaptopReady(): Promise<void>
}

declare global {
  interface Window {
    jaas: JaaSAPI
  }
}
