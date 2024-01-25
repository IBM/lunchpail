/*
 * Copyright 2020 The Kubernetes Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Transform } from "stream"
import type WithTimestamp from "@jaas/common/events/WithTimestamp"
import type KubernetesResource from "@jaas/common/events/KubernetesResource"

/**
 * A simple streaming JSON parser, yielding one callback per JSON struct.
 */
export default function transformToJSON(context: string, withTimestamp = false) {
  let escaping = false
  let inQuotes = false
  let depth = 0
  let bundle = ""

  return new Transform({
    transform(chunk: Buffer, _: string, callback) {
      const data = chunk.toString()

      const structs: unknown[] = []
      for (const ch of data) {
        const escaped = escaping
        escaping = false
        bundle += ch

        if (!inQuotes && ch === "{") {
          depth++
        }
        if (!escaped && ch === '"') {
          inQuotes = !inQuotes
        }
        if (!escaped && ch === "\\") {
          escaping = true
        }
        if (!inQuotes && ch === "}") {
          if (--depth === 0) {
            const event = JSON.parse(bundle) as KubernetesResource
            event.metadata.context = context

            structs.push(
              withTimestamp
                ? ({ timestamp: Date.now(), event, metadata: event.metadata } as WithTimestamp<unknown>)
                : event,
            )
            bundle = ""
          }
        }
      }

      callback(null, structs.length > 0 ? JSON.stringify(structs) : "")
    },
  })
}
