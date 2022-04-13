import { AssetId, EthereumAddress, SimpleDate, UnixTime } from '@l2beat/common'

import { ProjectInfo } from '../../model/ProjectInfo'
import { Token } from '../../model/Token'
import { Chart, ProjectData } from '../../old/tools/makeOutputData'
import {
  ReportRecord,
  ReportRepository,
  ReportWithBalance,
} from '../../peripherals/database/ReportRepository'

export interface ReportOutput {
  aggregate: Chart
  byProject: Record<string, ProjectData>
  experimental: Record<string, string>
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

export class ReportController {
  private projectNameByAddress = new Map<EthereumAddress, string>()
  private tokenByAssetId = new Map<AssetId, Token>()

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
      this.tokenByAssetId.set(token.id, token)
    }
  }

  async filterReports(): Promise<ReportWithBalance[]> {
    const reports = await this.reportRepository.getDaily()

    const maxByProject = await this.reportRepository.getMaxByProject()

    const maxTimestamp = getMaxTimestamp(maxByProject)
    const excludedProjects = getExcluded(maxByProject, maxTimestamp)

    return reports.filter(report => {
      if(report.timestamp > maxTimestamp || excludedProjects.includes(report.bridge)) {
        return false
      }
      return true
    })
  }

  async getDaily(): Promise<ReportOutput> {
    const aggregate = initAggregate(this.projects)
    const output = initOutput(this.projects)
    const reports = await this.reportRepository.getDaily()

    for (const report of reports) {
      const project = this.projectNameByAddress.get(report.bridge) ?? ''
      const token = this.tokenByAssetId.get(report.asset) ?? ''

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
      output.byProject[project].byToken[token.symbol] = byToken
    }

    output.aggregate.data = getAggregate(aggregate)

    for (const project of this.projects) {
      output.byProject[project.name].aggregate.data = getAggregateByProject(
        aggregate,
        project.name
      )

      for(const key in output.byProject[project.name].byToken) {
        const byToken = output.byProject[project.name].byToken[key]
        output.byProject[project.name].byToken[key].data = aggregateByToken(byToken)
      }
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
  token: Token,
  report: ReportWithBalance
) {
  const byToken = output.byProject[project].byToken[token.symbol] ?? {
    //TokenInfo.symbol
    types: ['date', token.symbol.toLocaleLowerCase(), 'usd'],
    data: [],
  }
  //jak jest kilka pooli to sie ponadpisuje i będą zera itp

  byToken.data.push([
    getKey(report.timestamp),
    +asNumber(report.balance, token.decimals).toFixed(6),
    asNumber(report.usdTVL, 2),
  ])
  return byToken
}

export function asNumber(value: bigint, precision: number) {
  const intPart = value / 10n ** BigInt(precision)
  const decimalPart = value - intPart * 10n ** BigInt(precision)

  const zerosBefore = precision - decimalPart.toString().length

  return (
    Number(intPart) +
    Number(
      Number(
        `0.${'0'.repeat(
          zerosBefore >= 0 ? zerosBefore : 0
        )}${decimalPart}`
      ).toFixed(precision)
    )
  )
}

function initOutput(projects: ProjectInfo[]): ReportOutput {
  const result: ReportOutput = {
    aggregate: { types: ['date', 'usd', 'eth'], data: [] },
    byProject: {}, //generateBYProject
    experimental: {}
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
function aggregateByToken(byToken: Chart): [string, number, number][] {
  const result: [string, number, number][] = []

  for(const d of byToken.data) {
    if(result[result.length - 1] && result[result.length - 1][0] === d[0]) {
      result[result.length - 1][1] += d[1]
      result[result.length - 1][2] += d[2]
    } else {
      result.push(d)
    }
  }

  return result

}

