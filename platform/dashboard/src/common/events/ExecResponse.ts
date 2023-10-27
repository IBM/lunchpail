type ExecResponse =
  | true
  | {
      code: unknown
      message: string
    }

export default ExecResponse
