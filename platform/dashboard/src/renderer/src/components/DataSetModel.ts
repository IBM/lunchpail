type DataSetModel = {
  /** Name of this dataset */
  label: string

  /** Optionally, to force that this dataset has a particular index in the UI (e.g. for UI coloring) */
  idx?: number

  /** Number of unassigned tasks for this dataset */
  inbox: number

  /** Number of completed tasks for this dataset */
  outbox: number

  /** e.g. COS vs NFS */
  storageType: string

  /** Endpoint URL */
  endpoint: string

  /** Prefix filepath */
  bucket: string

  /** Is the data to be provided without write access? */
  isReadOnly: boolean

  /** millis since epoch */
  timestamp: number
}

export default DataSetModel
