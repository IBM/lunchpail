export type JaaSApi = {
  on(source: "datasets" | "queues" | "pools" | "applications", cb: (...args: unknown[]) => void): void

  controlplane: {
    status: Promise<{
      clusterExists: boolean
      core: boolean
      example: boolean
    }>

    init(): Promise<void>

    destroy(): Promise<void>
  }
}

declare global {
  interface Window {
    jaas: JaaSAPI
  }
}
