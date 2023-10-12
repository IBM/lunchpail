export type JaaSApi = {
  on(source: "datasets" | "queues" | "pools" | "applications", cb: (...args: unknown[]) => void): void

  controlplane: {
    status: Promise<boolean>

    init(): Promise<void>

    destroy(): Promise<void>
  }
}

declare global {
  interface Window {
    jaas: JaaSAPI
  }
}
