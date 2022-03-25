import {
  AddressAnalyzer,
  AnalyzedAddress,
  EthereumAddress,
} from '@l2beat/common'
import { Contract, providers } from 'ethers'

import { ContractDescription, Contracts } from './config'

export interface AnalyzedItem {
  componentAddress: string
  libAddressManager: string
  componentContract: AnalyzedAddress
  [key: string]: unknown
}

/* 
Analyze Item. Get all item information and the list of "relatives", that is
the next set of items to be analysed 
*/
export async function analyzeItem(
  provider: providers.Provider,
  addressAnalyzer: AddressAnalyzer,
  libAddressManager: string,
  componentName: string,
  component: ContractDescription
): Promise<{ analyzed: AnalyzedItem }> {
  const libAbi = ['function getAddress(string) view returns (address)']

  const libAddressContract = new Contract(libAddressManager, libAbi, provider)
  const componentAddress = await libAddressContract.getAddress(componentName)
  const componentContract = await addressAnalyzer.analyze(componentAddress)
  let parameters: { name: string; value: unknown }[] = []
  let libAddressManagerLocal = ''

  if (componentContract.type === 'Contract' && componentContract.verified) {
    const addMgrAbi = ['function libAddressManager() view returns (address)']
    const libAddressContract = new Contract(
      componentAddress,
      addMgrAbi,
      provider
    )
    libAddressManagerLocal = await libAddressContract.libAddressManager()
    if (component.parameters) {
      parameters = await getParameters(component, componentAddress, provider)
    }
  }

  return {
    analyzed: {
      componentAddress,
      libAddressManager: libAddressManagerLocal,
      componentContract: componentContract as AnalyzedAddress,
      ...Object.fromEntries(parameters.map((x) => [x.name, x.value])),
    },
  }
}

async function getParameters(
  description: ContractDescription,
  address: string,
  provider: providers.Provider
): Promise<{ name: string; value: unknown }[]> {
  return await Promise.all(
    description.parameters?.map(async (entry) => {
      if (entry.type === 'constant') {
        return { name: entry.name, value: entry.value }
      } else {
        return getRegularParameter(address, entry.abi, provider)
      }
    }) ?? []
  )
}

async function getRegularParameter(
  address: string,
  method: string,
  provider: providers.Provider
) {
  const contract = new Contract(address, [method], provider)
  const methodName = Object.values(contract.interface.functions)[0].name
  const result = await contract[methodName]()
  return {
    name: methodName,
    value: result,
  }
}
