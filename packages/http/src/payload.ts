export const safeJson = (candidate: any) => {
  if( !candidate || typeof candidate !== 'string' ) {
    return candidate
  }

  const json = JSON.parse(candidate)
  delete json.constructor
  delete json.__proto__
  return json
}

