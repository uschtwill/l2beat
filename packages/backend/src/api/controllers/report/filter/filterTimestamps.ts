import { ReportWithBalance } from '../../../../peripherals/database/ReportRepository'
import { getExcluded } from './getExcluded'
import { getSyncedTimestamp } from './getLatestTimestamp'

export function filterTimestampsDaily(
  reports: ReportWithBalance[]
): ReportWithBalance[] {
  const latestTimestamp = getSyncedTimestamp(reports, {
    duration: 1,
    granularity: 'days',
  })
  const excluded = getExcluded(reports, latestTimestamp)

  return reports.filter(
    (report) =>
      report.timestamp.lte(latestTimestamp) &&
      !excluded.has(`${report.bridge}-${report.asset}`)
  )
}
