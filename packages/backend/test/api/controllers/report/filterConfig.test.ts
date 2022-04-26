import { AssetId, CoingeckoId, EthereumAddress, UnixTime } from '@l2beat/common'
import { TokenInfo } from '@l2beat/config'
import { expect } from 'earljs'

import { filterConfig } from '../../../../src/api/controllers/report/filterConfig'
import { ProjectInfo } from '../../../../src/model'
import { ReportWithBalance } from '../../../../src/peripherals/database/ReportRepository'

describe(filterConfig.name, () => {
  const START_BLOCK_NUMBER = 123456n
  const START = UnixTime.now().toStartOf('day')
  const MOCK_USD_TVL = 100000000n
  const MOCK_ETH_TVL = 100000n
  const MOCK_BALANCE = 1000000123456n * 10n ** BigInt(18 - 6)
  const ARBITRUM = EthereumAddress.random()
  const OPTIMISM = EthereumAddress.random()

  const PROJECTS: ProjectInfo[] = [
    {
      name: 'Arbitrum',
      bridges: [
        {
          address: ARBITRUM.toString(),
          sinceBlock: 0,
          tokens: [getDAI(), getUSDC()],
        },
      ],
    },
    {
      name: 'Optimism',
      bridges: [
        {
          address: OPTIMISM.toString(),
          sinceBlock: Number(START_BLOCK_NUMBER) + 100,
          tokens: [getDAI()],
        },
      ],
    },
  ]

  it('bridge not in config', () => {
    const reports: ReportWithBalance[] = [
      {
        blockNumber: START_BLOCK_NUMBER,
        timestamp: START,
        bridge: EthereumAddress.random(),
        asset: AssetId.DAI,
        usdTVL: MOCK_USD_TVL,
        ethTVL: MOCK_ETH_TVL,
        balance: MOCK_BALANCE,
      },
    ]

    const result = filterConfig(reports, PROJECTS)

    expect(result).toEqual([])
  })

  it('token not in bridge', () => {
    const reports: ReportWithBalance[] = [
      {
        blockNumber: START_BLOCK_NUMBER,
        timestamp: START,
        bridge: ARBITRUM,
        asset: AssetId.DAI,
        usdTVL: MOCK_USD_TVL,
        ethTVL: MOCK_ETH_TVL,
        balance: MOCK_BALANCE,
      },
      {
        blockNumber: START_BLOCK_NUMBER,
        timestamp: START,
        bridge: ARBITRUM,
        asset: AssetId.ETH,
        usdTVL: MOCK_USD_TVL,
        ethTVL: MOCK_ETH_TVL,
        balance: MOCK_BALANCE,
      },
    ]

    const result = filterConfig(reports, PROJECTS)

    expect(result).toEqual([
      {
        blockNumber: START_BLOCK_NUMBER,
        timestamp: START,
        bridge: ARBITRUM,
        asset: AssetId.DAI,
        usdTVL: MOCK_USD_TVL,
        ethTVL: MOCK_ETH_TVL,
        balance: MOCK_BALANCE,
      },
    ])
  })

  it('sinceBlock greater than report.blockNumber', () => {
    const reports: ReportWithBalance[] = [
      {
        blockNumber: START_BLOCK_NUMBER,
        timestamp: START,
        bridge: ARBITRUM,
        asset: AssetId.DAI,
        usdTVL: MOCK_USD_TVL,
        ethTVL: MOCK_ETH_TVL,
        balance: MOCK_BALANCE,
      },
      {
        blockNumber: START_BLOCK_NUMBER,
        timestamp: START,
        bridge: ARBITRUM,
        asset: AssetId.USDC,
        usdTVL: MOCK_USD_TVL,
        ethTVL: MOCK_ETH_TVL,
        balance: MOCK_BALANCE,
      },
      {
        blockNumber: START_BLOCK_NUMBER,
        timestamp: START,
        bridge: OPTIMISM,
        asset: AssetId.DAI,
        usdTVL: MOCK_USD_TVL,
        ethTVL: MOCK_ETH_TVL,
        balance: MOCK_BALANCE,
      },
    ]

    const result = filterConfig(reports, PROJECTS)

    expect(result).toEqual([
      {
        blockNumber: START_BLOCK_NUMBER,
        timestamp: START,
        bridge: ARBITRUM,
        asset: AssetId.DAI,
        usdTVL: MOCK_USD_TVL,
        ethTVL: MOCK_ETH_TVL,
        balance: MOCK_BALANCE,
      },
    ])
  })

  function getDAI(): TokenInfo {
    return {
      id: AssetId.DAI,
      name: 'Dai Stablecoin',
      coingeckoId: CoingeckoId('dai'),
      address: EthereumAddress('0x6B175474E89094C44Da98b954EedeAC495271d0F'),
      symbol: 'DAI',
      decimals: 18,
      sinceBlock: 0,
      category: 'stablecoin',
    }
  }

  function getUSDC(): TokenInfo {
    return {
      id: AssetId('usdc-usd-coin'),
      name: 'USD Coin',
      coingeckoId: CoingeckoId('usd-coin'),
      address: EthereumAddress('0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'),
      symbol: 'USDC',
      decimals: 6,
      sinceBlock: Number(START_BLOCK_NUMBER) + 100,
      category: 'stablecoin',
    }
  }
})
