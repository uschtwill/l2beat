import { AssetId, EthereumAddress, SimpleDate, UnixTime } from '@l2beat/common'

import { ProjectInfo } from '../../../model/ProjectInfo'
import { Token } from '../../../model/Token'
import { ReportRecord, ReportWithBalance } from '../../../peripherals/database/ReportRepository'
import { asNumber } from '../../../utils/asNumber'


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

export interface ProjectData {
  aggregate: Chart
  byToken: Record<string, Chart>
}

export interface Chart {
  types: ['date', string, string]
  data: [string, number, number][]
}

export function generateOutput(
  reports: ReportWithBalance[],
  projects: ProjectInfo[],
  tokens: Token[]
): ReportOutput {
  const projectNameByAddress = new Map<EthereumAddress, string>()
  const tokenByAssetId = new Map<AssetId, Token>()

  for (const project of projects) {
    for (const bridge of project.bridges) {
      projectNameByAddress.set(EthereumAddress(bridge.address), project.name)
    }
  }
  for (const token of tokens) {
    tokenByAssetId.set(token.id, token)
  }

  const aggregate = initAggregate(projects)
  const output = initOutput(projects)

  for (const report of reports) {
    const project = projectNameByAddress.get(report.bridge) ?? ''
    const token = tokenByAssetId.get(report.asset) ?? ''

    if (!project || !token) {
      continue
    }

    const byTimestamp = getByTimestamp(aggregate, report)
    aggregate.byTimestamp.set(getReportDailyKey(report.timestamp), byTimestamp)

    const byProject = getByProject(aggregate, project, report)
    aggregate.byProject
      .get(project)
      ?.byTimestamp.set(getReportDailyKey(report.timestamp), byProject)

    const byToken = getByToken(output, project, token, report)
    output.byProject[project].byToken[token.symbol] = byToken
  }

  output.aggregate.data = getAggregate(aggregate)

  for (const project of projects) {
    output.byProject[project.name].aggregate.data = getAggregateByProject(
      aggregate,
      project.name
    )

    for (const key in output.byProject[project.name].byToken) {
      const byToken = output.byProject[project.name].byToken[key]
      output.byProject[project.name].byToken[key].data =
        aggregateByToken(byToken)
    }
  }
  return output
}

function getByProject(
  aggregate: InnerReport,
  project: string,
  report: ReportRecord
) {
  const byProject = aggregate.byProject
    .get(project)
    ?.byTimestamp.get(getReportDailyKey(report.timestamp)) ?? {
    usd: 0n,
    eth: 0n,
  }

  return {
    usd: byProject.usd + report.usdTVL,
    eth: byProject.eth + report.ethTVL,
  }
}

function getByTimestamp(aggregate: InnerReport, report: ReportRecord) {
  const byTimestamp = aggregate.byTimestamp.get(
    getReportDailyKey(report.timestamp)
  ) ?? {
    usd: 0n,
    eth: 0n,
  }

  return {
    usd: byTimestamp.usd + report.usdTVL,
    eth: byTimestamp.eth + report.ethTVL,
  }
}

export function getReportDailyKey(timestamp: UnixTime) {
  return SimpleDate.fromUnixTimestamp(
    timestamp.add(-1, 'days').toNumber()
  ).toString()
}

function getByToken(
  output: ReportOutput,
  project: string,
  token: Token,
  report: ReportWithBalance
) {
  const byToken = output.byProject[project].byToken[token.symbol] ?? {
    types: ['date', token.symbol.toLocaleLowerCase(), 'usd'],
    data: [],
  }

  byToken.data.push([
    getReportDailyKey(report.timestamp),
    +asNumber(report.balance, token.decimals).toFixed(6),
    asNumber(report.usdTVL, 2),
  ])
  return byToken
}

function initOutput(projects: ProjectInfo[]): ReportOutput {
  const result: ReportOutput = {
    aggregate: { types: ['date', 'usd', 'eth'], data: [] },
    byProject: {}, //generateBYProject
    experimental: {},
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

  for (const d of byToken.data) {
    if (result[result.length - 1] && result[result.length - 1][0] === d[0]) {
      result[result.length - 1][1] += d[1]
      result[result.length - 1][2] += d[2]
    } else {
      result.push(d)
    }
  }

  return result
}
