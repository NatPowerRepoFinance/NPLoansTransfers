export const formatDate = (isoDate: string): string => {
  if (!isoDate) {
    return ''
  }

  const [year, month, day] = isoDate.split('-')
  if (!year || !month || !day) {
    return isoDate
  }

  return `${day}/${month}/${year}`
}

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-GB', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0)
}

export const formatCurrencyInteger = (value: number): string => {
  return new Intl.NumberFormat('en-GB', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0)
}

export const round2 = (value: number): number => {
  return Math.round(value * 100) / 100
}


