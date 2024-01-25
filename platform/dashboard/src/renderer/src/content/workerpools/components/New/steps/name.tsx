import { singular as workerpool } from "@jaas/resources/workerpools/name"

import type Values from "../Values"

export default {
  name: "Name your " + workerpool,
  isValid: (ctrl: Values) => !!ctrl.values.name,
  items: ["name" as const],
}
