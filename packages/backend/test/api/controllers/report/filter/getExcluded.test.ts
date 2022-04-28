import { AssetId, EthereumAddress, UnixTime } from '@l2beat/common'
import { expect } from 'earljs'

import { getExcluded } from '../../../../../src/api/controllers/report/filter/getExcluded'

describe(getExcluded.name, () => {
  const START_BLOCK_NUMBER = 123456n
  const START = UnixTime.now().toStartOf('day')
  const MOCK_USD_TVL = 100000000n
  const MOCK_ETH_TVL = 100000n
  const MOCK_BALANCE = 1000000123456n * 10n ** BigInt(18 - 6)
  const MOCK_BRIDGE = EthereumAddress.random()

  it('nothing to exclude', () => {
    const REPORTS = [
      {
        blockNumber: START_BLOCK_NUMBER,
        timestamp: START,
        bridge: MOCK_BRIDGE,
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

    const result = getExcluded(REPORTS, START)

    expect(result).toEqual(new Set())
  })

  it('exclude out of sync project', () => {
    const REPORTS = [
      {
        blockNumber: START_BLOCK_NUMBER,
        timestamp: START,
        bridge: MOCK_BRIDGE,
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
        timestamp: START.add(-22, 'days'),
        bridge: MOCK_BRIDGE,
        asset: AssetId.USDC,
        usdTVL: MOCK_USD_TVL,
        ethTVL: MOCK_ETH_TVL,
        balance: MOCK_BALANCE,
      },
    ]

    const result = getExcluded(REPORTS, START)

    expect(result).toEqual(
      new Set([
        `${MOCK_BRIDGE}-${AssetId.ETH}`,
        `${MOCK_BRIDGE}-${AssetId.USDC}`,
      ])
    )
  })
})
