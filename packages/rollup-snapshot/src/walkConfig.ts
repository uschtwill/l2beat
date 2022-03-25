import { AddressAnalyzer, UnverifiedContract } from '@l2beat/common'
import chalk from 'chalk'
import Table from 'easy-table'
import { BigNumber, constants, providers } from 'ethers'
import { mapValues } from 'lodash'

import { AnalyzedItem, analyzeItem } from './analyzeItem'
import { AnalyzedMainBridge, analyzeMainBridge } from './analyzeMainBridge'
import { Contracts, MainBridgeConfig } from './config'

export async function walkConfig(
  provider: providers.Provider,
  addressAnalyzer: AddressAnalyzer,
  contracts: Contracts,
  libAddressManager: string,
  network: string
) {
  const analyzedComponents = new Map<string, AnalyzedItem>()

  for (const [componentName, component] of Object.entries(contracts)) {
    // if (contract. === constants.AddressZero || resolved.has(componentName)) {
    //   continue
    // }
    const { analyzed } = await analyzeItem(
      provider,
      addressAnalyzer,
      libAddressManager,
      componentName,
      component
    )

    analyzedComponents.set(componentName, analyzed)
  }

  // console.log(JSON.stringify(analyzedComponents, undefined, 2))
  prettyPrintJson(analyzedComponents, network)
}

function prettyPrintJson(resolved: Map<string, AnalyzedItem>, network: string) {
  const output = {} as any

  for (const [componentName, analyzed] of resolved) {
    const item = {
      name: componentName,
      address: analyzed.componentAddress,
      parameters: mapValues(analyzed.parameters as any, prettifyValue),
    }

    output[componentName] = item
  }

  console.log(JSON.stringify(output, undefined, 2))
}

function prettifyValue(value: unknown) {
  if (BigNumber.isBigNumber(value)) {
    return value.toString()
  } else {
    return value
  }
}
