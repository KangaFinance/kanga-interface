import { CurrencyAmount, Token } from '@kangafinance/sdk'
import { useActiveWeb3React, useJumpContract } from '../../../hooks'
import useTrait, { BaseTrait } from './useTrait'

import { BaseStrategyHook } from '../strategies/useBaseStrategy'
import { useCallback } from 'react'
import { useDerivedJumpState } from '../hooks'
import { useERC20Permit } from '../../../hooks/useERC20Permit'
import { useTransactionAdder } from '../../transactions/hooks'

const TRAIT_CONFIG = {
  overrides: ['approveCallback', 'execute'],
}

export interface BaseStrategyWithHasPermitTokenHook extends BaseStrategyHook, BaseTrait {}

// Use this BaseStrategy when outputToken allows for a batched permitToken
// THIS TRAIT IS UNTESTED, PLEASE TEST THOROUGHLY BEFORE USING
const useHasPermitTokenTrait = (props: BaseStrategyHook): BaseStrategyWithHasPermitTokenHook => {
  const trait = useTrait(props, TRAIT_CONFIG)
  const { account } = useActiveWeb3React()
  const { zapIn, inputValue } = useDerivedJumpState()
  const jumpContract = useJumpContract()
  const addTransaction = useTransactionAdder()
  const { signatureData, gatherPermitSignature } = useERC20Permit(inputValue, jumpContract?.address, {
    type: 1,
    name: 'Kanga',
  })

  // Batch execute with permit if one is provided or else execute normally
  const batchExecute = useCallback(
    async (val: CurrencyAmount<Token>) => {
      const method = zapIn ? props.general.zapMethod : props.general.unzapMethod

      try {
        // If we have a permit, batch tx with permit
        if (signatureData) {
          const batch = [
            signatureData,
            jumpContract?.interface?.encodeFunctionData(method, [
              account,
              val.toExact().toBigNumber(val.currency.decimals),
            ]),
          ]

          const tx = await jumpContract.batch(batch, true)
          addTransaction(tx, {
            summary: `Approve Jump Master Contract and ${zapIn ? 'Deposit' : 'Withdraw'} ${props.general.outputSymbol}`,
          })

          return tx
        }

        // Else proceed normally
        else return props.execute(val)
      } catch (error) {
        console.error(error)
      }
    },
    [account, addTransaction, jumpContract, props, signatureData, zapIn]
  )

  // When we unzap and the token allows for a batched permitToken we don't have to approve jump to spend outputToken.
  // We can use the function permitToken
  return {
    ...trait,
    approveCallback: [
      props.approveCallback[0],
      gatherPermitSignature ? gatherPermitSignature : props.approveCallback[1],
    ],
    execute: batchExecute,
  }
}

export default useHasPermitTokenTrait
