import { AssetId, EthereumAddress, SimpleDate, UnixTime } from '@l2beat/common'

import { ProjectInfo } from '../../model/ProjectInfo'
import { Token } from '../../model/Token'
import { Chart, ProjectData } from '../../old/tools/makeOutputData'
import {
  ReportRecord,
  ReportRepository,
} from '../../peripherals/database/ReportRepository'

export interface ReportOutput {
  aggregate: Chart
  byProject: Record<string, ProjectData>
}

interface InnerReport {
  byTimestamp: Map<string, { usd: bigint; eth: bigint }>
  byProject: Map<
    string,
    {
      byTimestamp: Map<string, { usd: bigint; eth: bigint }>
    }
  >
}

//TODO discuss logging
export class ReportController {
  private projectNameByAddress = new Map<EthereumAddress, string>()
  private tokenSymbolByAssetId = new Map<AssetId, string>()

  constructor(
    private reportRepository: ReportRepository,
    private projects: ProjectInfo[],
    private tokens: Token[]
  ) {
    for (const project of this.projects) {
      for (const bridge of project.bridges) {
        this.projectNameByAddress.set(
          EthereumAddress(bridge.address),
          project.name
        )
      }
    }
    for (const token of this.tokens) {
      this.tokenSymbolByAssetId.set(token.id, token.symbol)
    }
  }

  async getDaily(): Promise<ReportOutput> {
    const aggregate = initAggregate(this.projects)
    const output = initOutput(this.projects)
    const reports = await this.reportRepository.getDaily()

    for (const report of reports) {
      const project = this.projectNameByAddress.get(report.bridge) ?? ''
      const token = this.tokenSymbolByAssetId.get(report.asset) ?? ''

      if (!project || !token) {
        continue
      }

      const byTimestamp = getByTimestamp(aggregate, report)
      aggregate.byTimestamp.set(getKey(report.timestamp), byTimestamp)

      const byProject = getByProject(aggregate, project, report)
      aggregate.byProject
        .get(project)
        ?.byTimestamp.set(getKey(report.timestamp), byProject)

      const byToken = getByToken(output, project, token, report)
      output.byProject[project].byToken[token] = byToken
    }

    output.aggregate.data = getAggregate(aggregate)

    for (const project of this.projects) {
      output.byProject[project.name].aggregate.data = getAggregateByProject(
        aggregate,
        project.name
      )
    }
    return output
  }
}

function getByProject(
  aggregate: InnerReport,
  project: string,
  report: ReportRecord
) {
  const byProject = aggregate.byProject
    .get(project)
    ?.byTimestamp.get(getKey(report.timestamp)) ?? { usd: 0n, eth: 0n }

  return {
    usd: byProject.usd + report.usdTVL,
    eth: byProject.eth + report.ethTVL,
  }
}

function getByTimestamp(aggregate: InnerReport, report: ReportRecord) {
  const byTimestamp = aggregate.byTimestamp.get(getKey(report.timestamp)) ?? {
    usd: 0n,
    eth: 0n,
  }

  return {
    usd: byTimestamp.usd + report.usdTVL,
    eth: byTimestamp.eth + report.ethTVL,
  }
}

function getKey(timestamp: UnixTime) {
  return SimpleDate.fromUnixTimestamp(timestamp.add(-1,'days').toNumber()).toString()
}

function getByToken(
  output: ReportOutput,
  project: string,
  token: string,
  report: ReportRecord
) {
  const byToken = output.byProject[project].byToken[token] ?? {
    //TokenInfo.symbol
    types: ['date', 'usd', 'eth'],
    data: [],
  }

  byToken.data.push([
    getKey(report.timestamp),
    asNumber(report.usdTVL, 2),
    asNumber(report.ethTVL, 6),
  ])
  return byToken
}

export function asNumber(value: bigint, precision: number) {
  const intPart = value / 10n ** BigInt(precision)
  const decimalPart = value - intPart * 10n ** BigInt(precision)

  return (
    Number(intPart) +
    Number(
      Number(
        `0.${'0'.repeat(
          precision - decimalPart.toString().length
        )}${decimalPart}`
      ).toFixed(precision)
    )
  )
}

function initOutput(projects: ProjectInfo[]): ReportOutput {
  const result: ReportOutput = {
    aggregate: { types: ['date', 'usd', 'eth'], data: [] },
    byProject: {}, //generateBYProject
  }

  for (const project of projects) {
    result.byProject[project.name] = {
      aggregate: { types: ['date', 'usd', 'eth'], data: [] },
      byToken: {},
    }
  }

  return result
}
function initAggregate(projects: ProjectInfo[]): InnerReport {
  return {
    byTimestamp: new Map(),
    byProject: new Map(
      projects.map((p) => [p.name, { byTimestamp: new Map() }])
    ),
  }
}

interface InnerReport {
  byTimestamp: Map<string, { usd: bigint; eth: bigint }>
  byProject: Map<
    string,
    {
      byTimestamp: Map<string, { usd: bigint; eth: bigint }>
    }
  >
}

function getAggregate(aggregate: InnerReport): [string, number, number][] {
  const result: [string, number, number][] = []

  for (const [timestamp, tvl] of aggregate.byTimestamp.entries()) {
    result.push([
      timestamp,
      Number(asNumber(tvl.usd, 2).toFixed(2)),
      Number(asNumber(tvl.eth, 6).toFixed(6)),
    ])
  }

  return result
}

function getAggregateByProject(
  aggregate: InnerReport,
  project: string
): [string, number, number][] {
  const result: [string, number, number][] = []

  const byProjectByTimestamp = aggregate.byProject.get(project)?.byTimestamp

  if (byProjectByTimestamp) {
    for (const [timestamp, tvl] of byProjectByTimestamp.entries()) {
      result.push([
        timestamp,
        Number(asNumber(tvl.usd, 2).toFixed(2)),
        Number(asNumber(tvl.eth, 6).toFixed(6)),
      ])
    }
  }
  return result
}
