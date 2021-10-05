import { ApprovalState, useActiveWeb3React, useApproveCallback, useJumpContract } from '../../../hooks'
import { useTransactionAdder } from '../../transactions/hooks'
import { Strategy, StrategyBalances, StrategyGeneralInfo, StrategyTokenDefinitions } from '../types'
import { useDerivedJumpState } from '../hooks'
import { useCallback, useMemo, useState } from 'react'
import { CurrencyAmount, Token } from '@kangafinance/sdk'
import { e10, tryParseAmount } from '../../../functions'
import useKangaPerXKanga from '../../../hooks/useXKangaPerKanga'
import { MobPermit } from '../../../hooks/useMobMasterApproveCallback'

export interface useBaseStrategyInterface {
  id: string
  general: StrategyGeneralInfo
  tokenDefinitions: StrategyTokenDefinitions
}

export interface BaseStrategyHook extends Strategy {
  execute: (val: CurrencyAmount<Token>, permit?: MobPermit) => Promise<any>
  approveCallback: [ApprovalState, () => Promise<void>, CurrencyAmount<Token>]
  getStrategy: () => Strategy
  calculateOutputFromInput: (
    zapIn: boolean,
    inputValue: string,
    inputToken: Token,
    outputToken: Token
  ) => Promise<string> | string
  balances: StrategyBalances
  setBalances: ({
    inputTokenBalance,
    outputTokenBalance,
  }: {
    inputTokenBalance?: CurrencyAmount<Token>
    outputTokenBalance?: CurrencyAmount<Token>
  }) => void
  mobApproveCallback?: null
}

// Every strategy should use a BaseStrategy. Can also use useBaseMobStrategy or useBaseHasPermitTokenStrategy
// which use BaseStrategy under the hood. Please look in both BaseStrategies to see what they offer and/or why you may need them
const useBaseStrategy = ({ id, general, tokenDefinitions }: useBaseStrategyInterface): BaseStrategyHook => {
  const { account } = useActiveWeb3React()
  const { inputValue, zapIn, tokens } = useDerivedJumpState()
  const jumpContract = useJumpContract()
  const addTransaction = useTransactionAdder()
  const approveCallback = useApproveCallback(inputValue, jumpContract?.address)
  const kangaPerXKanga = useKangaPerXKanga(true)
  const [balances, _setBalances] = useState<StrategyBalances>({
    inputTokenBalance: CurrencyAmount.fromRawAmount(tokens.inputToken, '0'),
    outputTokenBalance: CurrencyAmount.fromRawAmount(tokens.outputToken, '0'),
  })

  // Get basic strategy information
  const getStrategy = useCallback(() => {
    return {
      id,
      general,
      tokenDefinitions,
    }
  }, [general, id, tokenDefinitions])

  // Default execution function, can be overridden in child strategies
  // If you override, it's best to do some formatting beforehand and then still call this function
  // Look at useStakeKangaToCreamStrategy for an example
  const execute = useCallback(
    async (val: CurrencyAmount<Token>) => {
      if (!jumpContract) return

      const method = zapIn ? general.zapMethod : general.unzapMethod

      try {
        const tx = await jumpContract[method](account, val.quotient.toString())
        addTransaction(tx, {
          summary: `${zapIn ? 'Deposit' : 'Withdraw'} ${general.outputSymbol}`,
        })

        return tx
      } catch (error) {
        console.error(error)
      }
    },
    [account, addTransaction, general.outputSymbol, general.unzapMethod, general.zapMethod, jumpContract, zapIn]
  )

  // Default function for calculating the output based on the input
  // This one is converting Kanga to xKanga and vice-versa.
  // Function can be overridden or enhanced if you need custom input to output calculations
  const calculateOutputFromInput = useCallback(
    (zapIn: boolean, inputValue: string, inputToken: Token, outputToken: Token) => {
      if (!kangaPerXKanga || !inputValue) return null

      return (
        zapIn
          ? inputValue.toBigNumber(18).mulDiv(e10(18), kangaPerXKanga.toString().toBigNumber(18))
          : inputValue.toBigNumber(18).mulDiv(kangaPerXKanga.toString().toBigNumber(18), e10(18))
      )?.toFixed(18)
    },
    [kangaPerXKanga]
  )

  // Convenience wrapper function that allows for setting balances
  // Mostly used when balances are loaded async in child strategies
  const setBalances = useCallback(
    ({
      inputTokenBalance,
      outputTokenBalance,
    }: {
      inputTokenBalance?: CurrencyAmount<Token>
      outputTokenBalance?: CurrencyAmount<Token>
    }) => {
      _setBalances((prevState) => ({
        ...prevState,
        inputTokenBalance,
        outputTokenBalance,
      }))
    },
    []
  )

  return useMemo(
    () => ({
      id,
      general,
      tokenDefinitions,
      execute,
      approveCallback: [...approveCallback, inputValue],
      getStrategy,
      calculateOutputFromInput,
      balances: {
        inputTokenBalance: zapIn ? balances.inputTokenBalance : balances.outputTokenBalance,
        outputTokenBalance: zapIn ? balances.outputTokenBalance : balances.inputTokenBalance,
      },
      setBalances,
    }),
    [
      approveCallback,
      balances.inputTokenBalance,
      balances.outputTokenBalance,
      calculateOutputFromInput,
      execute,
      general,
      getStrategy,
      id,
      inputValue,
      setBalances,
      tokenDefinitions,
      zapIn,
    ]
  )
}

export default useBaseStrategy
