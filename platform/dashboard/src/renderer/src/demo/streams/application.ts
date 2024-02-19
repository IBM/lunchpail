import { uniqueNamesGenerator, animals } from "unique-names-generator"

import type EventSourceLike from "@jaas/common/events/EventSourceLike"
import type ApplicationSpecEvent from "@jaas/common/events/ApplicationSpecEvent"

import Base from "./base"
import lorem from "../util/lorem"
import colors from "./colors"
import context from "../context"
import { apiVersion, ns } from "./misc"

const apis = ["spark", "ray", "torch", "workqueue"]

const inputMd = colors

/**
 * Model of current applications. Note the use of a fixed starting
 * seed for the unique names generator. This is to give us a
 * deterministic sequence of Application names.
 */
export const applications = apis.map((api, idx) => ({
  name: uniqueNamesGenerator({ dictionaries: [animals], seed: 1696170097365 + idx }),
  namespace: ns,
  context,
  description: lorem.generateSentences(2),
  api,
  inputMd: inputMd[idx],
  repoPath: lorem.generateWords(2).replace(/\s/g, "/"),
  image: lorem.generateWords(2).replace(/\s/g, "-"),
}))

export default class DemoApplicationSpecEventSource extends Base implements EventSourceLike {
  private randomApplicationSpecEvent(
    {
      api,
      name,
      namespace,
      context,
      image,
      repoPath,
      description,
      inputMd,
    }: {
      api: string
      name: string
      namespace: string
      context: string
      image: string
      repoPath: string
      description: string
      inputMd: string
    },
    status = "Ready",
  ): ApplicationSpecEvent {
    return {
      apiVersion,
      kind: "Application",
      metadata: {
        name,
        namespace,
        context,
        creationTimestamp: new Date().toLocaleString(),
        annotations: {
          "codeflare.dev/status": status,
        },
      },
      spec: {
        description,
        api,
        image,
        repo: `https://github.com/${repoPath}`,
        command: `python ${name}.py`,
        supportsGpu: false,
        inputs: [{ sizes: { md: inputMd } }],
      },
    }
  }

  private sendEventFor = (application: (typeof applications)[number], status?: string) => {
    const model = this.randomApplicationSpecEvent(application, status)
    this.handlers.forEach((handler) => handler(new MessageEvent("application", { data: JSON.stringify([model]) })))
  }

  protected override initInterval(intervalMillis: number) {
    if (!this.interval) {
      const { sendEventFor } = this

      this.interval = setInterval(
        (function interval() {
          const whichToUpdate = Math.floor(Math.random() * applications.length)
          sendEventFor(applications[whichToUpdate])
          return interval
        })(), // () means invoke the interval right away
        intervalMillis,
      )
    }
  }

  public override delete(props: { name: string; namespace: string; context: string }) {
    const idx = applications.findIndex(
      (_) => _.name === props.name && _.namespace === props.namespace && _.context === props.context,
    )
    if (idx >= 0) {
      const model = applications[idx]
      applications.splice(idx, 1)
      this.sendEventFor(model, "Terminating")
      return true
    } else {
      return {
        code: 404,
        message: "Resource not found",
      }
    }
  }
}
