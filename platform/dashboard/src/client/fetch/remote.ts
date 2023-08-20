import Fetcher from "./index.js"
import type DataSetModel from "../components/DataSetModel"
import type WorkerPoolModel from "../components/WorkerPoolModel"

async function fetchRemoteJson<T>(route: string): Promise<T[]> {
  return (await fetch(route).then((response) => response.json())) as T[]
}

export default class RemoteFetcher implements Fetcher {
  public datasets() {
    return fetchRemoteJson<DataSetModel>("/datasets")
  }

  public workerpools() {
    return fetchRemoteJson<WorkerPoolModel>("/workerpools")
  }
}
