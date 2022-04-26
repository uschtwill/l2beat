import { AssetId, EthereumAddress, mock, UnixTime } from '@l2beat/common'
import { expect, mockFn } from 'earljs'

import {
  getExcluded,
  getSyncedTimestamp,
  ReportController,
} from '../../../../src/api/controllers/report/ReportController'
import { ReportRepository } from '../../../../src/peripherals/database/ReportRepository'

describe(ReportController.name, () => {
  describe(ReportController.prototype.getAndFilterReports.name, () => {
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

      const result = await reportController.getAndFilterReports('daily')

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

      const result = await reportController.getAndFilterReports('daily')

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

      const result = await reportController.getAndFilterReports('hourly')

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

      const result = await reportController.getAndFilterReports('hourly')

      expect(result).toEqual([REPORTS[1], REPORTS[2], REPORTS[3]])
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
      const SYNCED_TIMESTAMP = UnixTime.fromDate(
        new Date('2021-09-07T00:00:00Z')
      )

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
})
