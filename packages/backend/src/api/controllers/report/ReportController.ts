import { UnixTime } from '@l2beat/common'

import { ProjectInfo } from '../../../model/ProjectInfo'
import { Token } from '../../../model/Token'
import {
  ReportRepository,
  ReportWithBalance,
} from '../../../peripherals/database/ReportRepository'
import { generateOutput } from './generateOutput'

export class ReportController {
  constructor(
    private reportRepository: ReportRepository,
    private projects: ProjectInfo[],
    private tokens: Token[]
  ) {}

  async getDaily() {
    const reports = await this.getAndFilterReports('daily')

    const output = generateOutput(reports, this.projects, this.tokens)

    return output
  }

  async getAndFilterReports(
    granularity: 'daily' | 'hourly'
  ): Promise<ReportWithBalance[]> {
    const reports = await this.reportRepository.getDaily()

    const reportMax = reports.reduce((max, report) => report.timestamp.gt(max) ? report.timestamp : max, new UnixTime(0))
    const maxByAssetInBridge =
      await this.reportRepository.getMaxByAssetInBridge()

    const syncedTimestamp = getSyncedTimestamp(
      reportMax,
      maxByAssetInBridge,
      granularity
    )
    const excluded = getExcluded(maxByAssetInBridge, syncedTimestamp)

    return reports.filter((report) => {
      if (
        report.timestamp.gt(reportMax) ||
        excluded.has(`${report.bridge}-${report.asset}`)
      ) {
        return false
      }
      return true
    })
  }
}

export function getSyncedTimestamp(
  reportsMax: UnixTime,
  maxByAssetInBridge: Map<string, UnixTime>,
  granularity: 'daily' | 'hourly'
): UnixTime {
  let isOutOfSync = false
  const unixString = granularity === 'daily' ? 'days' : 'hours'

  for (const [_, timestamp] of maxByAssetInBridge.entries()) {
    if (
      !timestamp.equals(reportsMax) &&
      timestamp.add(1, unixString).equals(reportsMax)
    ) {
      isOutOfSync = true
    }
  }

  return isOutOfSync ? reportsMax.add(-1, unixString) : reportsMax
}

export function getExcluded(
  maxByAssetInBridge: Map<string, UnixTime>,
  syncedTimestamp: UnixTime
): Set<string> {
  const result: Set<string> = new Set()

  for (const [key, timestamp] of maxByAssetInBridge.entries()) {
    if (!timestamp.equals(syncedTimestamp)) {
      result.add(key)
    }
  }

  return result
}
