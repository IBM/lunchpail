type NewResourceHandler = (values: Record<string, string>, yaml: string) => void | Promise<void>

export default NewResourceHandler
