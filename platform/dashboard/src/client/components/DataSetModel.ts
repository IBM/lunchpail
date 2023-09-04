type DataSetModel = {
  /** Name of this dataset */
  label: string

  /** Number of unassigned tasks for this dataset */
  inbox: number

  /** Number of completed tasks for this dataset */
  outbox: number

  /** millis since epoch */
  timestamp: number
}

export default DataSetModel
