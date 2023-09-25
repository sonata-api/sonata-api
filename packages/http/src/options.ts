export type ServerOptions = {
  host?: string
  port?: number
}


export const defineServerOptions = (options?: ServerOptions) => {
  const {
    host = '0.0.0.0',
    port = 3000
  } = options || {}

  return <ServerOptions>({
    host,
    port
  })
}

