const rtf = new Intl.RelativeTimeFormat(undefined, {
  numeric: 'auto'
})

const units = {
  year: 24 * 60 * 60 * 1000 * 365,
  month: 24 * 60 * 60 * 1000 * 365/12,
  day: 24 * 60 * 60 * 1000,
  hour: 60 * 60 * 1000,
  minute: 60 * 1000,
  second: 1000
}

export const formatToString = function(target: Date, hours: boolean = false, locale = 'pt-BR') {
  return hours
    ? target.toLocaleString(locale).split(':').slice(0, -1).join(':')
    : target.toLocaleDateString(locale)
}

export const daysAgo = function(target: Date, days: number) {
  const d = new Date()
  d.setDate(target.getDate() - days)
  return d
}

export const getRelativeTimeFromNow = function(target: any) {
  const now = new Date()
  const elapsed = now as any - target

  for( const [u, value] of Object.entries(units) ) {
    if( Math.abs(elapsed) > value || u === 'second' ) {
      return rtf.format(-1*Math.round(elapsed/value), u as Intl.RelativeTimeFormatUnit)
    }
  }
}
