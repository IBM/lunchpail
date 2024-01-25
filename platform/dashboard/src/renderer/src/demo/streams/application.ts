import { uniqueNamesGenerator, animals } from "unique-names-generator"

import type EventSourceLike from "@jaas/common/events/EventSourceLike"
import type ApplicationSpecEvent from "@jaas/common/events/ApplicationSpecEvent"

import Base from "./base"
import lorem from "../util/lorem"
import context from "../context"
import { colors } from "./taskqueue"
import { apiVersion, ns } from "./misc"

export default class DemoApplicationSpecEventSource extends Base implements EventSourceLike {
  private readonly apis = ["spark", "ray", "torch", "workqueue"]
  private readonly inputMd = colors

  /**
   * Model of current applications. Note the use of a fixed starting
   * seed for the unique names generator. This is to give us a
   * deterministic sequence of Application names.
   */
  private readonly applications = this.apis.map((api, idx) => ({
    name: uniqueNamesGenerator({ dictionaries: [animals], seed: 1696170097365 + idx }),
    namespace: ns,
    description: lorem.generateSentences(2),
    api,
    inputMd: this.inputMd[idx],
    repoPath: lorem.generateWords(2).replace(/\s/g, "/"),
    image: lorem.generateWords(2).replace(/\s/g, "-"),
  }))

  private randomApplicationSpecEvent(
    {
      api,
      name,
      namespace,
      image,
      repoPath,
      description,
      inputMd,
    }: {
      api: string
      name: string
      namespace: string
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

  private sendEventFor = (application: (typeof this.applications)[number], status?: string) => {
    const model = this.randomApplicationSpecEvent(application, status)
    this.handlers.forEach((handler) => handler(new MessageEvent("application", { data: JSON.stringify([model]) })))
  }

  protected override initInterval(intervalMillis: number) {
    if (!this.interval) {
      const { applications, sendEventFor } = this

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

  public override delete(props: { name: string; namespace: string }) {
    const idx = this.applications.findIndex((_) => _.name === props.name && _.namespace === props.namespace)
    if (idx >= 0) {
      const model = this.applications[idx]
      this.applications.splice(idx, 1)
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
