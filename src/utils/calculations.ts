import type { ScheduleItem } from '../types'
import { round2 } from './format'

export interface CalculatedScheduleRow extends ScheduleItem {
  scheduleIndex: number
  days: number
  principal: number
  cumulativePrincipal: number
  interest: number
  cumulativeInterest: number
  total: number
}

const MS_IN_DAY = 24 * 60 * 60 * 1000

const calculateDays = (startDate: string, endDate: string): number => {
  const start = new Date(startDate)
  const end = new Date(endDate)

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return 0
  }

  const diff = Math.floor((end.getTime() - start.getTime()) / MS_IN_DAY)
  return diff > 0 ? diff : 0
}

export const calculateSchedule = (
  rows: ScheduleItem[],
  annualInterestRate: number,
  daysInYear: number,
): CalculatedScheduleRow[] => {
  const sortedRows = [...rows].sort((first, second) =>
    first.startDate.localeCompare(second.startDate),
  )

  let cumulativePrincipal = 0
  let cumulativeInterest = 0

  return sortedRows.map((row, index) => {
    const days = calculateDays(row.startDate, row.endDate)
    const principal = round2(row.drawDown - row.repayment)
    cumulativePrincipal = round2(cumulativePrincipal + principal)

    const interest = round2(
      ((cumulativePrincipal * annualInterestRate) / 100 / daysInYear) * days,
    )

    cumulativeInterest = round2(cumulativeInterest + interest)

    return {
      ...row,
      scheduleIndex: index + 1,
      days,
      principal,
      cumulativePrincipal,
      interest,
      cumulativeInterest,
      total: round2(cumulativePrincipal + cumulativeInterest),
    }
  })
}
