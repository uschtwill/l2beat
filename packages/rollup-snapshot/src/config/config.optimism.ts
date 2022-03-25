import { Config } from './Config'

export const config: Config = {
  libAddressManager: '0xdE1FCfB0851916CA5101820A69b13a4E276bd81F',
  contracts: {
    OVM_L1CrossDomainMessenger: {
      parameters: [
        {
          name: 'Owner',
          type: 'variable',
          description:
            'Current Owner. Owner can block messages, allow messages, pause relayer.',
          abi: 'function owner() view returns (address)',
        },
      ],
    },
    StateCommitmentChain: {
      parameters: [
        {
          name: 'FraudProofWindow',
          type: 'fixed',
          description: 'Fraud Proof Window in seconds',
          abi: 'function FRAUD_PROOF_WINDOW() view returns (uint256)',
        },
        {
          name: 'SequencerPublishWindow',
          type: 'fixed',
          description:
            'Window (in seconds) in which only Sequencer can publish state roots',
          abi: 'function SEQUENCER_PUBLISH_WINDOW() view returns (uint256)',
        },
      ],
    },
    CanonicalTransactionChain: {
      parameters: [
        {
          name: 'MIN_ROLLUP_TX_GAS',
          value: '100000',
          type: 'constant',
          description: 'Mimumum L2 tx gas limit',
        },
        {
          name: 'MAX_ROLLUP_TX_SIZE',
          value: '50000',
          type: 'constant',
          description: 'Maximum L2 tx size',
        },
        {
          name: 'maxTransactionGasLimit',
          type: 'fixed',
          description: '',
          abi: 'function maxTransactionGasLimit() view returns (uint256)',
        },
        {
          name: 'enqueueGasCost',
          type: 'variable',
          description: 'Approximate cost of calling the enqueue() function',
          abi: 'function enqueueGasCost() view returns (uint256)',
        },
        {
          name: 'l2GasDiscountDivisor',
          type: 'variable',
          description: 'Ratio of cost of L1 gas to the cost of L2 gas',
          abi: 'function l2GasDiscountDivisor() view returns (uint256)',
        },
        {
          name: 'enqueueL2GasPrepaid',
          type: 'variable',
          description: '',
          abi: 'function enqueueL2GasPrepaid() view returns (uint256)',
        },
      ],
    },
  },
}
