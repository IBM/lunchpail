import { uniqueNamesGenerator, animals } from "unique-names-generator"

import type EventSourceLike from "../../events/EventSourceLike"
import type ApplicationSpecEvent from "../../events/ApplicationSpecEvent"

import Base from "./base"
import { ns } from "./misc"
import lorem from "../util/lorem"

export default class DemoApplicationSpecEventSource extends Base implements EventSourceLike {
  private readonly apis = ["workqueue", "ray", "torch", "workqueue"]
  private readonly inputMd = ["blue", "green", "blue", "purple"]

  /** Model of current applications */
  private readonly applications = this.apis.map((api, idx) => ({
    name: uniqueNamesGenerator({ dictionaries: [animals] }),
    description: lorem.generateSentences(2),
    api,
    inputMd: this.inputMd[idx],
    repoPath: lorem.generateWords(2).replace(/\s/g, "/"),
    image: lorem.generateWords(2).replace(/\s/g, "-"),
    file: lorem.generateWords(1).replace(/\s/g, "-"),
  }))

  private randomApplicationSpecEvent({
    api,
    name,
    file,
    image,
    repoPath,
    description,
    inputMd,
  }: {
    api: string
    name: string
    file: string
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
      command: `python ${file}.py`,
      supportsGpu: false,
      "data sets": { md: inputMd },
      age: new Date().toLocaleString(),
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
