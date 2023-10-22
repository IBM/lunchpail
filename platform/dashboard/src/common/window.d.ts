import type JayApi from "@jay/common/api/jay"

declare global {
  interface Window {
    live: JayApi
    demo: JayApi
    jay: JayApi
  }
}
