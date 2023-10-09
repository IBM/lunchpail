type NewPoolHandler = {
  newPool(values: Record<string, string>, yaml: string): void | Promise<void>
}

export default NewPoolHandler
