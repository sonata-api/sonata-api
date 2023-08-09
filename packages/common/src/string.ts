import { formatToString } from './date'

export const capitalize = function(target: string) {
  return target.charAt(0).toUpperCase() + target.slice(1)
}

export const formatDateTime = function(target: string, hours: boolean = false) {
  const d = new Date(target)
  if( isNaN(d.getDate()) ) {
    return '-'
  }

  return formatToString(d, hours)
}
