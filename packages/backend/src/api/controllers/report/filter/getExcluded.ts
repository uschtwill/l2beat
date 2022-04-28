import { UnixTime } from '@l2beat/common'

import { ReportWithBalance } from '../../../../peripherals/database/ReportRepository'

export function getExcluded(
  reports: ReportWithBalance[],
  latestTimestamp: UnixTime
): Set<string> {
  const maxByAssetInBridge = getMaxAssetInBridge(reports)

  const result: Set<string> = new Set()
  for (const [key, timestamp] of maxByAssetInBridge.entries()) {
    if (timestamp.lt(latestTimestamp)) {
      result.add(key)
    }
  }
  return result
}

function getMaxAssetInBridge(reports: ReportWithBalance[]) {
  const maxByAssetInBridge = new Map<string, UnixTime>()
  for (const report of reports) {
    const key = `${report.bridge}-${report.asset}`
    const max = maxByAssetInBridge.get(key)
    if (!max || max.lt(report.timestamp)) {
      maxByAssetInBridge.set(key, report.timestamp)
    }
  }
  return maxByAssetInBridge
}
