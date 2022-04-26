import { AssetId, CoingeckoId, EthereumAddress, UnixTime } from '@l2beat/common'
import { TokenInfo } from '@l2beat/config'
import { expect } from 'earljs'

import {
  generateOutput,
  getReportDailyKey,
} from '../../../../src/api/controllers/report/generateOutput'
import { ProjectInfo } from '../../../../src/model'
import { ReportWithBalance } from '../../../../src/peripherals/database/ReportRepository'

describe(generateOutput.name, () => {
  it('one token and one project', async () => {
    const START_BLOCK_NUMBER = 123456n
    const MOCK_BRIDGE = EthereumAddress(
      '0x011B6E24FfB0B5f5fCc564cf4183C5BBBc96D515'
    )
    const MOCK_ASSET = AssetId('dai-dai-stablecoin')
    const MOCK_USD_TVL = 100000000n
    const MOCK_ETH_TVL = 100000n

    const START = UnixTime.now().toStartOf('day')

    const DATA: ReportWithBalance[] = [
      {
        blockNumber: START_BLOCK_NUMBER - 2000n,
        timestamp: START.add(-2, 'days'),
        bridge: MOCK_BRIDGE,
        asset: MOCK_ASSET,
        usdTVL: MOCK_USD_TVL,
        ethTVL: MOCK_ETH_TVL,
        balance: 1000000123456n * 10n ** BigInt(18 - 6),
      },
      {
        blockNumber: START_BLOCK_NUMBER - 1000n,
        timestamp: START.add(-1, 'days'),
        bridge: MOCK_BRIDGE,
        asset: MOCK_ASSET,
        usdTVL: MOCK_USD_TVL,
        ethTVL: MOCK_ETH_TVL,
        balance: 1000000123456n * 10n ** BigInt(18 - 6),
      },
      {
        blockNumber: START_BLOCK_NUMBER,
        timestamp: START,
        bridge: MOCK_BRIDGE,
        asset: MOCK_ASSET,
        usdTVL: MOCK_USD_TVL,
        ethTVL: MOCK_ETH_TVL,
        balance: 1000000123456n * 10n ** BigInt(18 - 6),
      },
    ]

    const TOKENS: TokenInfo[] = [
      {
        id: AssetId('dai-dai-stablecoin'),
        name: 'Dai Stablecoin',
        coingeckoId: CoingeckoId('dai'),
        address: EthereumAddress('0x6B175474E89094C44Da98b954EedeAC495271d0F'),
        symbol: 'DAI',
        decimals: 18,
        sinceBlock: 8950398,
        category: 'stablecoin',
      },
    ]

    const PROJECTS: ProjectInfo[] = [
      {
        name: 'Arbitrum',
        bridges: [
          {
            address: MOCK_BRIDGE.toString(),
            sinceBlock: 0,
            tokens: TOKENS,
          },
        ],
      },
    ]
    const result = generateOutput(DATA, PROJECTS, TOKENS)

    expect(result).toEqual({
      aggregate: {
        types: ['date', 'usd', 'eth'],
        data: [
          [getReportDailyKey(START.add(-2, 'days')), 1000000, 0.1],
          [getReportDailyKey(START.add(-1, 'days')), 1000000, 0.1],
          [getReportDailyKey(START), 1000000, 0.1],
        ],
      },
      byProject: {
        ['Arbitrum']: {
          //Project.name
          aggregate: {
            types: ['date', 'usd', 'eth'],
            data: [
              [getReportDailyKey(START.add(-2, 'days')), 1000000, 0.1],
              [getReportDailyKey(START.add(-1, 'days')), 1000000, 0.1],
              [getReportDailyKey(START), 1000000, 0.1],
            ],
          },
          byToken: {
            ['DAI']: {
              //TokenInfo.symbol
              types: ['date', 'dai', 'usd'],
              data: [
                [
                  getReportDailyKey(START.add(-2, 'days')),
                  1000000.123456,
                  1000000,
                ],
                [
                  getReportDailyKey(START.add(-1, 'days')),
                  1000000.123456,
                  1000000,
                ],
                [getReportDailyKey(START), 1000000.123456, 1000000],
              ],
            },
          },
        },
      },
      experimental: {},
    })
  })

  it('multiple tokens multiple projects', async () => {
    const START_BLOCK_NUMBER = 123456n
    const MOCK_BRIDGE = EthereumAddress(
      '0x011B6E24FfB0B5f5fCc564cf4183C5BBBc96D515'
    )
    const MOCK_BRIDGE_2 = EthereumAddress.random()

    const MOCK_ASSET = AssetId('dai-dai-stablecoin')
    const MOCK_ASSET_2 = AssetId('uni-uniswap')
    const MOCK_USD_TVL = 100000000n
    const MOCK_ETH_TVL = 100000n
    const MOCK_USD_TVL_2 = 200000000n
    const MOCK_ETH_TVL_2 = 200000n

    const START = UnixTime.now().toStartOf('day')

    const DATA: ReportWithBalance[] = [
      {
        blockNumber: START_BLOCK_NUMBER - 2000n,
        timestamp: START.add(-2, 'days'),
        bridge: MOCK_BRIDGE,
        asset: MOCK_ASSET,
        usdTVL: MOCK_USD_TVL,
        ethTVL: MOCK_ETH_TVL,
        balance: 1000000123456n * 10n ** BigInt(18 - 6),
      },
      {
        blockNumber: START_BLOCK_NUMBER - 2000n,
        timestamp: START.add(-2, 'days'),
        bridge: MOCK_BRIDGE_2,
        asset: MOCK_ASSET_2,
        usdTVL: MOCK_USD_TVL_2,
        ethTVL: MOCK_ETH_TVL_2,
        balance: 20000123456n * 10n ** BigInt(18 - 6),
      },
      {
        blockNumber: START_BLOCK_NUMBER - 1000n,
        timestamp: START.add(-1, 'days'),
        bridge: MOCK_BRIDGE,
        asset: MOCK_ASSET,
        usdTVL: MOCK_USD_TVL,
        ethTVL: MOCK_ETH_TVL,
        balance: 1000000123456n * 10n ** BigInt(18 - 6),
      },
      {
        blockNumber: START_BLOCK_NUMBER - 1000n,
        timestamp: START.add(-1, 'days'),
        bridge: MOCK_BRIDGE_2,
        asset: MOCK_ASSET_2,
        usdTVL: MOCK_USD_TVL_2,
        ethTVL: MOCK_ETH_TVL_2,
        balance: 20000123456n * 10n ** BigInt(18 - 6),
      },
      {
        blockNumber: START_BLOCK_NUMBER,
        timestamp: START,
        bridge: MOCK_BRIDGE,
        asset: MOCK_ASSET,
        usdTVL: MOCK_USD_TVL,
        ethTVL: MOCK_ETH_TVL,
        balance: 1000000123456n * 10n ** BigInt(18 - 6),
      },
      {
        blockNumber: START_BLOCK_NUMBER,
        timestamp: START,
        bridge: MOCK_BRIDGE_2,
        asset: MOCK_ASSET_2,
        usdTVL: MOCK_USD_TVL_2,
        ethTVL: MOCK_ETH_TVL_2,
        balance: 20000123456n * 10n ** BigInt(18 - 6),
      },
    ]

    const TOKENS: TokenInfo[] = [
      {
        id: AssetId('dai-dai-stablecoin'),
        name: 'Dai Stablecoin',
        coingeckoId: CoingeckoId('dai'),
        address: EthereumAddress('0x6B175474E89094C44Da98b954EedeAC495271d0F'),
        symbol: 'DAI',
        decimals: 18,
        sinceBlock: 8950398,
        category: 'stablecoin',
      },
      {
        id: AssetId('uni-uniswap'),
        name: 'Uniswap',
        coingeckoId: CoingeckoId('uniswap'),
        address: EthereumAddress('0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984'),
        symbol: 'UNI',
        decimals: 18,
        sinceBlock: 10861674,
        category: 'other',
      },
    ]

    const PROJECTS = [
      {
        name: 'Arbitrum',
        bridges: [
          {
            address: MOCK_BRIDGE.toString(),
            sinceBlock: 0,
            tokens: TOKENS,
          },
        ],
      },
      {
        name: 'Random',
        bridges: [
          {
            address: MOCK_BRIDGE_2.toString(),
            sinceBlock: 0,
            tokens: TOKENS,
          },
        ],
      },
    ]

    const result = generateOutput(DATA, PROJECTS, TOKENS)

    expect(result).toEqual({
      aggregate: {
        types: ['date', 'usd', 'eth'],
        data: [
          [getReportDailyKey(START.add(-2, 'days')), 3000000, 0.3],
          [getReportDailyKey(START.add(-1, 'days')), 3000000, 0.3],
          [getReportDailyKey(START), 3000000, 0.3],
        ],
      },
      byProject: {
        ['Arbitrum']: {
          //Project.name
          aggregate: {
            types: ['date', 'usd', 'eth'],
            data: [
              [getReportDailyKey(START.add(-2, 'days')), 1000000, 0.1],
              [getReportDailyKey(START.add(-1, 'days')), 1000000, 0.1],
              [getReportDailyKey(START), 1000000, 0.1],
            ],
          },
          byToken: {
            ['DAI']: {
              //TokenInfo.symbol
              types: ['date', 'dai', 'usd'],
              data: [
                [
                  getReportDailyKey(START.add(-2, 'days')),
                  1000000.123456,
                  1000000,
                ],
                [
                  getReportDailyKey(START.add(-1, 'days')),
                  1000000.123456,
                  1000000,
                ],
                [getReportDailyKey(START), 1000000.123456, 1000000],
              ],
            },
          },
        },
        ['Random']: {
          //Project.name
          aggregate: {
            types: ['date', 'usd', 'eth'],
            data: [
              [getReportDailyKey(START.add(-2, 'days')), 2000000, 0.2],
              [getReportDailyKey(START.add(-1, 'days')), 2000000, 0.2],
              [getReportDailyKey(START), 2000000, 0.2],
            ],
          },
          byToken: {
            ['UNI']: {
              //TokenInfo.symbol
              types: ['date', 'uni', 'usd'],
              data: [
                [
                  getReportDailyKey(START.add(-2, 'days')),
                  20000.123456,
                  2000000,
                ],
                [
                  getReportDailyKey(START.add(-1, 'days')),
                  20000.123456,
                  2000000,
                ],
                [getReportDailyKey(START), 20000.123456, 2000000],
              ],
            },
          },
        },
      },
      experimental: {},
    })
  })

  it('multiple bridges', async () => {
    const START_BLOCK_NUMBER = 123456n
    const MOCK_BRIDGE = EthereumAddress(
      '0x011B6E24FfB0B5f5fCc564cf4183C5BBBc96D515'
    )
    const MOCK_BRIDGE_2 = EthereumAddress.random()
    const MOCK_ASSET = AssetId('dai-dai-stablecoin')
    const MOCK_USD_TVL = 100000000n
    const MOCK_ETH_TVL = 100000n

    const START = UnixTime.now().toStartOf('day')

    const DATA: ReportWithBalance[] = [
      {
        blockNumber: START_BLOCK_NUMBER - 2000n,
        timestamp: START.add(-2, 'days'),
        bridge: MOCK_BRIDGE,
        asset: MOCK_ASSET,
        usdTVL: MOCK_USD_TVL,
        ethTVL: MOCK_ETH_TVL,
        balance: 1000000111111n * 10n ** BigInt(18 - 6),
      },
      {
        blockNumber: START_BLOCK_NUMBER - 2000n,
        timestamp: START.add(-2, 'days'),
        bridge: MOCK_BRIDGE_2,
        asset: MOCK_ASSET,
        usdTVL: MOCK_USD_TVL,
        ethTVL: MOCK_ETH_TVL,
        balance: 1000000111111n * 10n ** BigInt(18 - 6),
      },
      {
        blockNumber: START_BLOCK_NUMBER - 1000n,
        timestamp: START.add(-1, 'days'),
        bridge: MOCK_BRIDGE,
        asset: MOCK_ASSET,
        usdTVL: MOCK_USD_TVL,
        ethTVL: MOCK_ETH_TVL,
        balance: 1000000111111n * 10n ** BigInt(18 - 6),
      },
      {
        blockNumber: START_BLOCK_NUMBER - 1000n,
        timestamp: START.add(-1, 'days'),
        bridge: MOCK_BRIDGE_2,
        asset: MOCK_ASSET,
        usdTVL: MOCK_USD_TVL,
        ethTVL: MOCK_ETH_TVL,
        balance: 1000000111111n * 10n ** BigInt(18 - 6),
      },
      {
        blockNumber: START_BLOCK_NUMBER,
        timestamp: START,
        bridge: MOCK_BRIDGE,
        asset: MOCK_ASSET,
        usdTVL: MOCK_USD_TVL,
        ethTVL: MOCK_ETH_TVL,
        balance: 1000000111111n * 10n ** BigInt(18 - 6),
      },
      {
        blockNumber: START_BLOCK_NUMBER,
        timestamp: START,
        bridge: MOCK_BRIDGE_2,
        asset: MOCK_ASSET,
        usdTVL: MOCK_USD_TVL,
        ethTVL: MOCK_ETH_TVL,
        balance: 1000000111111n * 10n ** BigInt(18 - 6),
      },
    ]

    const TOKENS: TokenInfo[] = [
      {
        id: AssetId('dai-dai-stablecoin'),
        name: 'Dai Stablecoin',
        coingeckoId: CoingeckoId('dai'),
        address: EthereumAddress('0x6B175474E89094C44Da98b954EedeAC495271d0F'),
        symbol: 'DAI',
        decimals: 18,
        sinceBlock: 8950398,
        category: 'stablecoin',
      },
    ]

    const PROJECTS = [
      {
        name: 'Arbitrum',
        bridges: [
          {
            address: MOCK_BRIDGE.toString(),
            sinceBlock: 0,
            tokens: TOKENS,
          },
          {
            address: MOCK_BRIDGE_2.toString(),
            sinceBlock: 0,
            tokens: TOKENS,
          },
        ],
      },
    ]

    const result = generateOutput(DATA, PROJECTS, TOKENS)

    expect(result).toEqual({
      aggregate: {
        types: ['date', 'usd', 'eth'],
        data: [
          [getReportDailyKey(START.add(-2, 'days')), 2000000, 0.2],
          [getReportDailyKey(START.add(-1, 'days')), 2000000, 0.2],
          [getReportDailyKey(START), 2000000, 0.2],
        ],
      },
      byProject: {
        ['Arbitrum']: {
          //Project.name
          aggregate: {
            types: ['date', 'usd', 'eth'],
            data: [
              [getReportDailyKey(START.add(-2, 'days')), 2000000, 0.2],
              [getReportDailyKey(START.add(-1, 'days')), 2000000, 0.2],
              [getReportDailyKey(START), 2000000, 0.2],
            ],
          },
          byToken: {
            ['DAI']: {
              //TokenInfo.symbol
              types: ['date', 'dai', 'usd'],
              data: [
                [
                  getReportDailyKey(START.add(-2, 'days')),
                  2000000.222222,
                  2000000,
                ],
                [
                  getReportDailyKey(START.add(-1, 'days')),
                  2000000.222222,
                  2000000,
                ],
                [getReportDailyKey(START), 2000000.222222, 2000000],
              ],
            },
          },
        },
      },
      experimental: {},
    })
  })
})

describe(getReportDailyKey.name, () => {
  it('returns key from one day before', () => {
    const date = UnixTime.fromDate(new Date('2021-09-07T00:00:00Z'))

    const result = getReportDailyKey(date)

    expect(result).toEqual('2021-09-06')
  })
})
