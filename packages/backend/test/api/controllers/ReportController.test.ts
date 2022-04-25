import {
  AssetId,
  CoingeckoId,
  EthereumAddress,
  mock,
  SimpleDate,
  UnixTime,
} from '@l2beat/common'
import { TokenInfo } from '@l2beat/config'
import { expect, mockFn } from 'earljs'

import {
  asNumber,
  getExcluded,
  getReportDailyKey,
  getSyncedTimestamp,
  ReportController,
} from '../../../src/api/controllers/ReportController'
import {
  ReportRepository,
  ReportWithBalance,
} from '../../../src/peripherals/database/ReportRepository'

describe(ReportController.name, () => {
  describe(ReportController.prototype.buildDaily.name, () => {
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
          address: EthereumAddress(
            '0x6B175474E89094C44Da98b954EedeAC495271d0F'
          ),
          symbol: 'DAI',
          decimals: 18,
          sinceBlock: 8950398,
          category: 'stablecoin',
        },
      ]

      const reportRepository = mock<ReportRepository>({
        getDaily: mockFn().returns(DATA),
      })

      const reportController = new ReportController(
        reportRepository,
        [
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
        ],
        TOKENS
      )

      const result = await reportController.buildDaily(DATA)

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
          address: EthereumAddress(
            '0x6B175474E89094C44Da98b954EedeAC495271d0F'
          ),
          symbol: 'DAI',
          decimals: 18,
          sinceBlock: 8950398,
          category: 'stablecoin',
        },
        {
          id: AssetId('uni-uniswap'),
          name: 'Uniswap',
          coingeckoId: CoingeckoId('uniswap'),
          address: EthereumAddress(
            '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984'
          ),
          symbol: 'UNI',
          decimals: 18,
          sinceBlock: 10861674,
          category: 'other',
        },
      ]

      const reportRepository = mock<ReportRepository>({
        getDaily: mockFn().returns(DATA),
      })

      const reportController = new ReportController(
        reportRepository,
        [
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
        ],
        TOKENS
      )

      const result = await reportController.buildDaily(DATA)

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
          address: EthereumAddress(
            '0x6B175474E89094C44Da98b954EedeAC495271d0F'
          ),
          symbol: 'DAI',
          decimals: 18,
          sinceBlock: 8950398,
          category: 'stablecoin',
        },
      ]

      const reportRepository = mock<ReportRepository>({
        getDaily: mockFn().returns(DATA),
      })

      const reportController = new ReportController(
        reportRepository,
        [
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
        ],
        TOKENS
      )

      const result = await reportController.buildDaily(DATA)

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

  describe(ReportController.prototype.filterReports.name, () => {
    it('nothing to filter', async () => {
      const START_BLOCK_NUMBER = 123456n
      const START = UnixTime.now().toStartOf('day')
      const MOCK_USD_TVL = 100000000n
      const MOCK_ETH_TVL = 100000n
      const MOCK_BALANCE = 1000000123456n * 10n ** BigInt(18 - 6)
      const MOCK_BRIDGE = EthereumAddress.random()

      const REPORTS = [
        {
          blockNumber: START_BLOCK_NUMBER,
          timestamp: START,
          bridge: EthereumAddress.random(),
          asset: AssetId.DAI,
          usdTVL: MOCK_USD_TVL,
          ethTVL: MOCK_ETH_TVL,
          balance: MOCK_BALANCE,
        },
        {
          blockNumber: START_BLOCK_NUMBER,
          timestamp: START,
          bridge: MOCK_BRIDGE,
          asset: AssetId.ETH,
          usdTVL: MOCK_USD_TVL,
          ethTVL: MOCK_ETH_TVL,
          balance: MOCK_BALANCE,
        },
        {
          blockNumber: START_BLOCK_NUMBER,
          timestamp: START,
          bridge: MOCK_BRIDGE,
          asset: AssetId.USDC,
          usdTVL: MOCK_USD_TVL,
          ethTVL: MOCK_ETH_TVL,
          balance: MOCK_BALANCE,
        },
      ]

      const reportRepository = mock<ReportRepository>({
        getDaily: mockFn().returns(REPORTS),
        getMaxTimestamp: mockFn().returns(START),
        getMaxByAssetInBridge: mockFn().returns(
          new Map(REPORTS.map((r) => [`${r.bridge}-${r.asset}`, r.timestamp]))
        ),
      })

      const reportController = new ReportController(reportRepository, [], [])

      const result = await reportController.filterReports('daily')

      expect(result).toEqual(REPORTS)
    })

    it('two synced one very old', async () => {
      const START_BLOCK_NUMBER = 123456n
      const START = UnixTime.now().toStartOf('day')
      const MOCK_USD_TVL = 100000000n
      const MOCK_ETH_TVL = 100000n
      const MOCK_BALANCE = 1000000123456n * 10n ** BigInt(18 - 6)
      const MOCK_BRIDGE = EthereumAddress.random()

      const REPORTS = [
        {
          blockNumber: START_BLOCK_NUMBER,
          timestamp: START,
          bridge: EthereumAddress.random(),
          asset: AssetId.DAI,
          usdTVL: MOCK_USD_TVL,
          ethTVL: MOCK_ETH_TVL,
          balance: MOCK_BALANCE,
        },
        {
          blockNumber: START_BLOCK_NUMBER,
          timestamp: START.add(-365, 'days'),
          bridge: MOCK_BRIDGE,
          asset: AssetId.ETH,
          usdTVL: MOCK_USD_TVL,
          ethTVL: MOCK_ETH_TVL,
          balance: MOCK_BALANCE,
        },
        {
          blockNumber: START_BLOCK_NUMBER,
          timestamp: START,
          bridge: MOCK_BRIDGE,
          asset: AssetId.USDC,
          usdTVL: MOCK_USD_TVL,
          ethTVL: MOCK_ETH_TVL,
          balance: MOCK_BALANCE,
        },
      ]

      const reportRepository = mock<ReportRepository>({
        getDaily: mockFn().returns(REPORTS),
        getMaxTimestamp: mockFn().returns(START),
        getMaxByAssetInBridge: mockFn().returns(
          new Map(REPORTS.map((r) => [`${r.bridge}-${r.asset}`, r.timestamp]))
        ),
      })

      const reportController = new ReportController(reportRepository, [], [])

      const result = await reportController.filterReports('daily')

      expect(result).toEqual([REPORTS[0], REPORTS[2]])
    })

    it('e.g. 13:00 12:00 11:00', async () => {
      const START_BLOCK_NUMBER = 123456n
      const START = UnixTime.now().toStartOf('day')
      const MOCK_USD_TVL = 100000000n
      const MOCK_ETH_TVL = 100000n
      const MOCK_BALANCE = 1000000123456n * 10n ** BigInt(18 - 6)
      const MOCK_BRIDGE = EthereumAddress.random()

      const REPORTS = [
        {
          blockNumber: START_BLOCK_NUMBER,
          timestamp: START,
          bridge: EthereumAddress.random(),
          asset: AssetId.DAI,
          usdTVL: MOCK_USD_TVL,
          ethTVL: MOCK_ETH_TVL,
          balance: MOCK_BALANCE,
        },
        {
          blockNumber: START_BLOCK_NUMBER,
          timestamp: START.add(-1, 'hours'),
          bridge: EthereumAddress.random(),
          asset: AssetId.DAI,
          usdTVL: MOCK_USD_TVL,
          ethTVL: MOCK_ETH_TVL,
          balance: MOCK_BALANCE,
        },
        {
          blockNumber: START_BLOCK_NUMBER,
          timestamp: START.add(-2, 'hours'),
          bridge: EthereumAddress.random(),
          asset: AssetId.DAI,
          usdTVL: MOCK_USD_TVL,
          ethTVL: MOCK_ETH_TVL,
          balance: MOCK_BALANCE,
        },
        {
          blockNumber: START_BLOCK_NUMBER - 100n,
          timestamp: START.add(-1, 'hours'),
          bridge: MOCK_BRIDGE,
          asset: AssetId.ETH,
          usdTVL: MOCK_USD_TVL,
          ethTVL: MOCK_ETH_TVL,
          balance: MOCK_BALANCE,
        },
        {
          blockNumber: START_BLOCK_NUMBER - 100n,
          timestamp: START.add(-2, 'hours'),
          bridge: MOCK_BRIDGE,
          asset: AssetId.ETH,
          usdTVL: MOCK_USD_TVL,
          ethTVL: MOCK_ETH_TVL,
          balance: MOCK_BALANCE,
        },
        {
          blockNumber: START_BLOCK_NUMBER - 200n,
          timestamp: START.add(-2, 'hours'),
          bridge: MOCK_BRIDGE,
          asset: AssetId.USDC,
          usdTVL: MOCK_USD_TVL,
          ethTVL: MOCK_ETH_TVL,
          balance: MOCK_BALANCE,
        },
      ]

      const reportRepository = mock<ReportRepository>({
        getDaily: mockFn().returns(REPORTS),
        getMaxTimestamp: mockFn().returns(START),
        getMaxByAssetInBridge: mockFn().returns(
          new Map([
            [`${REPORTS[0].bridge}-${REPORTS[0].asset}`, REPORTS[0].timestamp],
            [`${REPORTS[3].bridge}-${REPORTS[3].asset}`, REPORTS[3].timestamp],
            [`${REPORTS[5].bridge}-${REPORTS[5].asset}`, REPORTS[5].timestamp],
          ])
        ),
      })

      const reportController = new ReportController(reportRepository, [], [])

      const result = await reportController.filterReports('hourly')

      expect(result).toEqual([REPORTS[1], REPORTS[2], REPORTS[3], REPORTS[4]])
    })

    it('e.g. 13:00 12:00 12:00', async () => {
      const START_BLOCK_NUMBER = 123456n
      const START = UnixTime.fromDate(new Date('2021-09-07T13:00:00Z'))
      const MOCK_USD_TVL = 100000000n
      const MOCK_ETH_TVL = 100000n
      const MOCK_BALANCE = 1000000123456n * 10n ** BigInt(18 - 6)
      const MOCK_BRIDGE = EthereumAddress.random()

      const REPORTS = [
        {
          blockNumber: START_BLOCK_NUMBER,
          timestamp: START,
          bridge: EthereumAddress.random(),
          asset: AssetId.DAI,
          usdTVL: MOCK_USD_TVL,
          ethTVL: MOCK_ETH_TVL,
          balance: MOCK_BALANCE,
        },
        {
          blockNumber: START_BLOCK_NUMBER,
          timestamp: START.add(-1, 'hours'),
          bridge: EthereumAddress.random(),
          asset: AssetId.DAI,
          usdTVL: MOCK_USD_TVL,
          ethTVL: MOCK_ETH_TVL,
          balance: MOCK_BALANCE,
        },
        {
          blockNumber: START_BLOCK_NUMBER - 100n,
          timestamp: START.add(-1, 'hours'),
          bridge: MOCK_BRIDGE,
          asset: AssetId.ETH,
          usdTVL: MOCK_USD_TVL,
          ethTVL: MOCK_ETH_TVL,
          balance: MOCK_BALANCE,
        },
        {
          blockNumber: START_BLOCK_NUMBER - 200n,
          timestamp: START.add(-1, 'hours'),
          bridge: MOCK_BRIDGE,
          asset: AssetId.USDC,
          usdTVL: MOCK_USD_TVL,
          ethTVL: MOCK_ETH_TVL,
          balance: MOCK_BALANCE,
        },
      ]

      const reportRepository = mock<ReportRepository>({
        getDaily: mockFn().returns(REPORTS),
        getMaxTimestamp: mockFn().returns(START),
        getMaxByAssetInBridge: mockFn().returns(
          new Map([
            [`${REPORTS[0].bridge}-${REPORTS[0].asset}`, REPORTS[0].timestamp],
            [`${REPORTS[2].bridge}-${REPORTS[2].asset}`, REPORTS[2].timestamp],
            [`${REPORTS[3].bridge}-${REPORTS[3].asset}`, REPORTS[3].timestamp],
          ])
        ),
      })

      const reportController = new ReportController(reportRepository, [], [])

      const result = await reportController.filterReports('hourly')

      expect(result).toEqual([REPORTS[1], REPORTS[2], REPORTS[3]])
    })
  })

  describe(asNumber.name, () => {
    it('1234567 || 6 precision digits', () => {
      const result = asNumber(1234567n, 6)

      expect(result).toEqual(1.234567)
    })

    it('123 || 2 precision digits', () => {
      const result = asNumber(123n, 2)

      expect(result).toEqual(1.23)
    })

    it('12345 || 6 precision digits', () => {
      const result = asNumber(12345n, 6)

      expect(result).toEqual(0.012345)
    })

    it('1 || 2 precision digits', () => {
      const result = asNumber(1n, 2)

      expect(result).toEqual(0.01)
    })

    it('100123456000000000000 || 18 precision digits', () => {
      const result = asNumber(100123456000000000000n, 18)

      expect(result).toEqual(100.123456)
    })

    it('123456000000000000 || 18 precision digits', () => {
      const result = asNumber(123456000000000000n, 18)

      expect(result).toEqual(0.123456)
    })

    it('123 || 0 precision digits', () => {
      const result = asNumber(123n, 0)

      expect(result).toEqual(123)
    })
  })
})

describe(getSyncedTimestamp.name, () => {
  it('all projects synced', async () => {
    const MAX = UnixTime.fromDate(new Date('2021-09-07T00:00:00Z'))

    const MAX_BY_ASSET_IN_BRIDGE = new Map([
      ['0xA-tokenA', MAX],
      ['0xB-tokenA', MAX],
      ['0xB-tokenB', MAX],
    ])

    const result = getSyncedTimestamp(MAX, MAX_BY_ASSET_IN_BRIDGE, 'daily')

    expect(result).toEqual(MAX)
  })

  it('project out of sync for one day', async () => {
    const MAX = UnixTime.fromDate(new Date('2021-09-07T00:00:00Z'))

    const MAX_BY_ASSET_IN_BRIDGE = new Map([
      ['0xA-tokenA', MAX],
      ['0xB-tokenA', MAX.add(-1, 'days')],
      ['0xB-tokenB', MAX],
    ])

    const result = getSyncedTimestamp(MAX, MAX_BY_ASSET_IN_BRIDGE, 'daily')

    expect(result).toEqual(MAX.add(-1, 'days'))
  })

  it('project out of sync for more than one day', async () => {
    const MAX = UnixTime.fromDate(new Date('2021-09-07T00:00:00Z'))

    const MAX_BY_ASSET_IN_BRIDGE = new Map([
      ['0xA-tokenA', MAX],
      ['0xB-tokenA', MAX.add(-200, 'days')],
      ['0xB-tokenB', MAX],
    ])

    const result = getSyncedTimestamp(MAX, MAX_BY_ASSET_IN_BRIDGE, 'daily')

    expect(result).toEqual(MAX)
  })
})

describe(getExcluded.name, () => {
  it('excludes out of sync assets in bridges', () => {
    const SYNCED_TIMESTAMP = UnixTime.fromDate(new Date('2021-09-07T00:00:00Z'))

    const MAX_BY_ASSET_IN_BRIDGE = new Map([
      ['0xA-tokenA', SYNCED_TIMESTAMP],
      ['0xB-tokenA', SYNCED_TIMESTAMP.add(-1, 'days')],
      ['0xB-tokenB', SYNCED_TIMESTAMP],
      ['0xC-tokenC', SYNCED_TIMESTAMP.add(-200, 'days')],
    ])

    const result = getExcluded(MAX_BY_ASSET_IN_BRIDGE, SYNCED_TIMESTAMP)

    expect(result).toEqual(new Set(['0xB-tokenA', '0xC-tokenC']))
  })
})

describe(getReportDailyKey.name, () => {
  it('returns key from one day before', () => {
    const date = UnixTime.fromDate(new Date('2021-09-07T00:00:00Z'))

    const result = getReportDailyKey(date)

    expect(result).toEqual('2021-09-06')
  })
})
