import { formatToString, type DateFormatOptions } from './date'

export const capitalize = function(target: string) {
  return target.charAt(0).toUpperCase() + target.slice(1)
}

export const formatDateTime = function(target: string, options?: DateFormatOptions) {
  const date = new Date(target)
  if( isNaN(date.getDate()) ) {
    return '-'
  }

  return formatToString(date, options)
}
