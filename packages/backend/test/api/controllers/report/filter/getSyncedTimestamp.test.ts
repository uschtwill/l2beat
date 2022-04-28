import { AssetId, EthereumAddress, UnixTime } from '@l2beat/common'
import { expect } from 'earljs'

import { getSyncedTimestamp } from '../../../../../src/api/controllers/report/filter/getSyncedTimestamp'

describe(getSyncedTimestamp.name, () => {
  it('every report synced', async () => {
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

    const result = getSyncedTimestamp(REPORTS, {
      duration: 1,
      granularity: 'days',
    })

    expect(result).toEqual(START)
  })

  it('one report very out of sync', async () => {
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

    const result = getSyncedTimestamp(REPORTS, {
      duration: 1,
      granularity: 'days',
    })

    expect(result).toEqual(START)
  })

  it('get previous day', async () => {
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
        bridge: MOCK_BRIDGE,
        asset: AssetId.DAI,
        usdTVL: MOCK_USD_TVL,
        ethTVL: MOCK_ETH_TVL,
        balance: MOCK_BALANCE,
      },
      {
        blockNumber: START_BLOCK_NUMBER,
        timestamp: START.add(-1, 'days'),
        bridge: MOCK_BRIDGE,
        asset: AssetId.DAI,
        usdTVL: MOCK_USD_TVL,
        ethTVL: MOCK_ETH_TVL,
        balance: MOCK_BALANCE,
      },
      {
        blockNumber: START_BLOCK_NUMBER,
        timestamp: START.add(-2, 'days'),
        bridge: MOCK_BRIDGE,
        asset: AssetId.DAI,
        usdTVL: MOCK_USD_TVL,
        ethTVL: MOCK_ETH_TVL,
        balance: MOCK_BALANCE,
      },
      {
        blockNumber: START_BLOCK_NUMBER - 100n,
        timestamp: START.add(-1, 'days'),
        bridge: MOCK_BRIDGE,
        asset: AssetId.ETH,
        usdTVL: MOCK_USD_TVL,
        ethTVL: MOCK_ETH_TVL,
        balance: MOCK_BALANCE,
      },
      {
        blockNumber: START_BLOCK_NUMBER - 100n,
        timestamp: START.add(-2, 'days'),
        bridge: MOCK_BRIDGE,
        asset: AssetId.ETH,
        usdTVL: MOCK_USD_TVL,
        ethTVL: MOCK_ETH_TVL,
        balance: MOCK_BALANCE,
      },
      {
        blockNumber: START_BLOCK_NUMBER - 200n,
        timestamp: START.add(-2, 'days'),
        bridge: MOCK_BRIDGE,
        asset: AssetId.USDC,
        usdTVL: MOCK_USD_TVL,
        ethTVL: MOCK_ETH_TVL,
        balance: MOCK_BALANCE,
      },
    ]

    const result = getSyncedTimestamp(REPORTS, {
      duration: 1,
      granularity: 'days',
    })

    expect(result).toEqual(START.add(-1,'days'))
  })

})
