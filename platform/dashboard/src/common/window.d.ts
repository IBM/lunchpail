import type JaasApi from "@jaas/common/api/jaas"

declare global {
  interface Window {
    live: JaasApi
    demo: JaasApi
    jaas: JaasApi
  }
}
