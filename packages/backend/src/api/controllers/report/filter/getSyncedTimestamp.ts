import { UnixTime } from '@l2beat/common'

import { ReportWithBalance } from '../../../../peripherals/database/ReportRepository'

export function getSyncedTimestamp(
  reports: ReportWithBalance[],
  threshold: { duration: number; granularity: 'days' | 'hours' }
): UnixTime {
  const maxTimestamp = reports.reduce(
    (max, { timestamp }) => (timestamp.gt(max) ? timestamp : max),
    new UnixTime(0)
  )

  const allSynced = reports.every(
    (x) =>
      x.timestamp.equals(maxTimestamp) ||
      x.timestamp.lt(maxTimestamp.add(-threshold.duration, threshold.granularity))
  )
  return allSynced
    ? maxTimestamp
    : maxTimestamp.add(-threshold.duration, threshold.granularity)
}
