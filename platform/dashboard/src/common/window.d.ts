import type JayApi from "@jay/common/api/jay"

declare global {
  interface Window {
    jay: JayApi
  }
}
