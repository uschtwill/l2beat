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
  ReportController,
} from '../../../src/api/controllers/ReportController'
import {
  ReportRecord,
  ReportRepository,
} from '../../../src/peripherals/database/ReportRepository'

describe(ReportController.name, () => {
  describe(ReportController.prototype.getDaily.name, () => {
    it('one token and one project', async () => {
      const START_BLOCK_NUMBER = 123456n
      const MOCK_BRIDGE = EthereumAddress(
        '0x011B6E24FfB0B5f5fCc564cf4183C5BBBc96D515'
      )
      const MOCK_ASSET = AssetId('dai-dai-stablecoin')
      const MOCK_USD_TVL = 100000000n
      const MOCK_ETH_TVL = 100000n

      const START = UnixTime.now().toStartOf('day')

      const DATA: ReportRecord[] = [
        {
          blockNumber: START_BLOCK_NUMBER - 2000n,
          timestamp: START.add(-2, 'days'),
          bridge: MOCK_BRIDGE,
          asset: MOCK_ASSET,
          usdTVL: MOCK_USD_TVL,
          ethTVL: MOCK_ETH_TVL,
        },
        {
          blockNumber: START_BLOCK_NUMBER - 1000n,
          timestamp: START.add(-1, 'days'),
          bridge: MOCK_BRIDGE,
          asset: MOCK_ASSET,
          usdTVL: MOCK_USD_TVL,
          ethTVL: MOCK_ETH_TVL,
        },
        {
          blockNumber: START_BLOCK_NUMBER,
          timestamp: START,
          bridge: MOCK_BRIDGE,
          asset: MOCK_ASSET,
          usdTVL: MOCK_USD_TVL,
          ethTVL: MOCK_ETH_TVL,
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

      const result = await reportController.getDaily()

      expect(result).toEqual({
        aggregate: {
          types: ['date', 'usd', 'eth'],
          data: [
            [getKey(START.add(-2, 'days')), 1000000, 0.1],
            [getKey(START.add(-1, 'days')), 1000000, 0.1],
            [getKey(START), 1000000, 0.1],
          ],
        },
        byProject: {
          ['Arbitrum']: {
            //Project.name
            aggregate: {
              types: ['date', 'usd', 'eth'],
              data: [
                [getKey(START.add(-2, 'days')), 1000000, 0.1],
                [getKey(START.add(-1, 'days')), 1000000, 0.1],
                [getKey(START), 1000000, 0.1],
              ],
            },
            byToken: {
              ['DAI']: {
                //TokenInfo.symbol
                types: ['date', 'usd', 'eth'],
                data: [
                  [getKey(START.add(-2, 'days')), 1000000, 0.1],
                  [getKey(START.add(-1, 'days')), 1000000, 0.1],
                  [getKey(START), 1000000, 0.1],
                ],
              },
            },
          },
        },
        experimental:{}
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

      const DATA: ReportRecord[] = [
        {
          blockNumber: START_BLOCK_NUMBER - 2000n,
          timestamp: START.add(-2, 'days'),
          bridge: MOCK_BRIDGE,
          asset: MOCK_ASSET,
          usdTVL: MOCK_USD_TVL,
          ethTVL: MOCK_ETH_TVL,
        },
        {
          blockNumber: START_BLOCK_NUMBER - 1000n,
          timestamp: START.add(-1, 'days'),
          bridge: MOCK_BRIDGE,
          asset: MOCK_ASSET,
          usdTVL: MOCK_USD_TVL,
          ethTVL: MOCK_ETH_TVL,
        },
        {
          blockNumber: START_BLOCK_NUMBER,
          timestamp: START,
          bridge: MOCK_BRIDGE,
          asset: MOCK_ASSET,
          usdTVL: MOCK_USD_TVL,
          ethTVL: MOCK_ETH_TVL,
        },
        {
          blockNumber: START_BLOCK_NUMBER - 2000n,
          timestamp: START.add(-2, 'days'),
          bridge: MOCK_BRIDGE_2,
          asset: MOCK_ASSET_2,
          usdTVL: MOCK_USD_TVL_2,
          ethTVL: MOCK_ETH_TVL_2,
        },
        {
          blockNumber: START_BLOCK_NUMBER - 1000n,
          timestamp: START.add(-1, 'days'),
          bridge: MOCK_BRIDGE_2,
          asset: MOCK_ASSET_2,
          usdTVL: MOCK_USD_TVL_2,
          ethTVL: MOCK_ETH_TVL_2,
        },
        {
          blockNumber: START_BLOCK_NUMBER,
          timestamp: START,
          bridge: MOCK_BRIDGE_2,
          asset: MOCK_ASSET_2,
          usdTVL: MOCK_USD_TVL_2,
          ethTVL: MOCK_ETH_TVL_2,
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

      const result = await reportController.getDaily()

      expect(result).toEqual({
        aggregate: {
          types: ['date', 'usd', 'eth'],
          data: [
            [getKey(START.add(-2, 'days')), 3000000, 0.3],
            [getKey(START.add(-1, 'days')), 3000000, 0.3],
            [getKey(START), 3000000, 0.3],
          ],
        },
        byProject: {
          ['Arbitrum']: {
            //Project.name
            aggregate: {
              types: ['date', 'usd', 'eth'],
              data: [
                [getKey(START.add(-2, 'days')), 1000000, 0.1],
                [getKey(START.add(-1, 'days')), 1000000, 0.1],
                [getKey(START), 1000000, 0.1],
              ],
            },
            byToken: {
              ['DAI']: {
                //TokenInfo.symbol
                types: ['date', 'usd', 'eth'],
                data: [
                  [getKey(START.add(-2, 'days')), 1000000, 0.1],
                  [getKey(START.add(-1, 'days')), 1000000, 0.1],
                  [getKey(START), 1000000, 0.1],
                ],
              },
            },
          },
          ['Random']: {
            //Project.name
            aggregate: {
              types: ['date', 'usd', 'eth'],
              data: [
                [getKey(START.add(-2, 'days')), 2000000, 0.2],
                [getKey(START.add(-1, 'days')), 2000000, 0.2],
                [getKey(START), 2000000, 0.2],
              ],
            },
            byToken: {
              ['UNI']: {
                //TokenInfo.symbol
                types: ['date', 'usd', 'eth'],
                data: [
                  [getKey(START.add(-2, 'days')), 2000000, 0.2],
                  [getKey(START.add(-1, 'days')), 2000000, 0.2],
                  [getKey(START), 2000000, 0.2],
                ],
              },
            },
          },
        },
        experimental:{}
      })
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
  })
})

function getKey(timestamp: UnixTime) {
  return SimpleDate.fromUnixTimestamp(timestamp.toNumber()).toString()
}
