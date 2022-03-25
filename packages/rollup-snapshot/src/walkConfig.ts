import { AddressAnalyzer, UnverifiedContract } from '@l2beat/common'
import chalk from 'chalk'
import Table from 'easy-table'
import { BigNumber, constants, providers } from 'ethers'

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

  prettyPrint(analyzedComponents, network)
}

function prettyPrint(resolved: Map<string, AnalyzedItem>, network: string) {
  //console.debug(resolved)
  const t = new Table()
  const t2 = new Table()
  const t3 = new Table()
  for (const [componentName, analyzed] of resolved) {
    const addressType = analyzed.componentContract.type
    let contractName = ''
    if (addressType === 'Contract') {
      if (analyzed.componentContract.verified) {
        contractName = analyzed.componentContract.name
      } else {
        contractName = chalk.red('Not verified !')
      }
    }
    t.cell('Name', componentName)
    t.cell('Address', analyzed.componentAddress)
    t.cell('Type', analyzed.componentContract.type)
    t.cell('ContractName', contractName)
    t.newRow()

    if (addressType === 'Contract') {
      t2.cell('Name', componentName)
      t2.cell('LibAddressManager', analyzed.libAddressManager)
      t2.newRow()

      for (const [key, value] of Object.entries(analyzed)) {
        if (
          key != 'componentAddress' &&
          key != 'libAddressManager' &&
          key != 'componentContract'
        ) {
          t3.cell('Component', componentName)
          t3.cell('Parameter', key)
          t3.cell('Value', prettifyValue(value))
          t3.newRow()
        }
      }
    }
  }
  console.log()
  console.log('Components of', network)
  console.log()
  console.log(t.toString())

  console.log()
  console.log('LibAddressManager of', network)
  console.log()
  console.log(t2.toString())

  console.log()
  console.log('Parameters of', network)
  console.log()
  console.log(t3.toString())
}

function prettifyValue(value: unknown) {
  if (BigNumber.isBigNumber(value)) {
    return chalk.yellow(value)
  } else if (typeof value === 'string') {
    return chalk.blue(value)
  } else {
    return value
  }
}
