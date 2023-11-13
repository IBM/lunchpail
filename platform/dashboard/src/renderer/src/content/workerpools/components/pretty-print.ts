/**
 * Remove some internal naming bits, to clean up the presentation
 */
export default function prettyPrintWorkerPoolName(workerpoolName: string, taskqueueName: string) {
  return workerpoolName.replace(taskqueueName + "-pool-", "")
}
