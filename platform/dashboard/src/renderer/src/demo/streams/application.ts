import { uniqueNamesGenerator, animals } from "unique-names-generator"

import type EventSourceLike from "@jaas/common/events/EventSourceLike"
import type ApplicationSpecEvent from "@jaas/common/events/ApplicationSpecEvent"

import Base from "./base"
import { ns } from "./misc"
import lorem from "../util/lorem"
import { colors } from "./dataset"

export default class DemoApplicationSpecEventSource extends Base implements EventSourceLike {
  private readonly apis = ["spark", "ray", "torch", "workqueue"]
  private readonly inputMd = [colors[0], colors[1], colors[0], colors[2]]

  /**
   * Model of current applications. Note the use of a fixed starting
   * seed for the unique names generator. This is to give us a
   * deterministic sequence of Application names.
   */
  private readonly applications = this.apis.map((api, idx) => ({
    name: uniqueNamesGenerator({ dictionaries: [animals], seed: 1696170097365 + idx }),
    description: lorem.generateSentences(2),
    api,
    inputMd: this.inputMd[idx],
    repoPath: lorem.generateWords(2).replace(/\s/g, "/"),
    image: lorem.generateWords(2).replace(/\s/g, "-"),
  }))

  private randomApplicationSpecEvent({
    api,
    name,
    image,
    repoPath,
    description,
    inputMd,
  }: {
    api: string
    name: string
    image: string
    repoPath: string
    description: string
    inputMd: string
  }): ApplicationSpecEvent {
    return {
      timestamp: Date.now(),
      namespace: ns,
      application: name,
      description,
      api,
      image,
      repo: `https://github.com/${repoPath}`,
      command: `python ${name}.py`,
      supportsGpu: false,
      "data sets": { md: inputMd },
      age: new Date().toLocaleString(),
      status: "Ready",
    }
  }

  protected override initInterval(intervalMillis: number) {
    if (!this.interval) {
      const { applications, handlers, randomApplicationSpecEvent } = this

      this.interval = setInterval(
        (function interval() {
          const whichToUpdate = Math.floor(Math.random() * applications.length)
          const application = applications[whichToUpdate]
          const model = randomApplicationSpecEvent(application)
          handlers.forEach((handler) => handler(new MessageEvent("application", { data: JSON.stringify(model) })))
          return interval
        })(), // () means invoke the interval right away
        intervalMillis,
      )
    }
  }
}
