import { ApprovalState, useActiveWeb3React, useJumpContract } from '../../../hooks'
import { CurrencyAmount, Token } from '@kangafinance/sdk'
import useMobMasterApproveCallback, { MobMasterApproveCallback } from '../../../hooks/useMobMasterApproveCallback'
import useTrait, { BaseTrait } from './useTrait'

import { BaseStrategyHook } from '../strategies/useBaseStrategy'
import { useCallback } from 'react'
import { useDerivedJumpState } from '../hooks'
import { useTransactionAdder } from '../../transactions/hooks'

const TRAIT_CONFIG = {
  overrides: ['execute', 'approveCallback', 'mobApproveCallback'],
}

export interface BaseStrategyWithMobTraitHook
  extends Omit<BaseStrategyHook, 'approveCallback' | 'mobApproveCallback'>,
    BaseTrait {
  approveCallback: [ApprovalState, () => Promise<void>] | null
  mobApproveCallback?: MobMasterApproveCallback
  overrides: string[]
}

// Use this trait when strategies have Mob as their output.
// Strategies that end up in Mob don't need to to approve jump to spend tokens when unzapping
// hence the approveCallback is null when unzapping
const useMobTrait = (props: BaseStrategyHook): BaseStrategyWithMobTraitHook => {
  const trait = useTrait(props, TRAIT_CONFIG)
  const { account } = useActiveWeb3React()
  const { zapIn } = useDerivedJumpState()
  const jumpContract = useJumpContract()
  const addTransaction = useTransactionAdder()
  const mobApproveCallback = useMobMasterApproveCallback(jumpContract.address, {
    otherMobContract: jumpContract,
    contractName: 'Jump',
    functionFragment: 'setMobApproval',
  })

  // Batch execute with permit if one is provided or else execute normally
  const batchExecute = useCallback(
    async (val: CurrencyAmount<Token>) => {
      if (!jumpContract) return

      const method = zapIn ? props.general.zapMethod : props.general.unzapMethod

      try {
        // If we have a permit, batch tx with permit
        if (mobApproveCallback.permit) {
          const batch = [
            mobApproveCallback.permit.data,
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
    [account, addTransaction, mobApproveCallback.permit, jumpContract, props, zapIn]
  )

  // When we unzap from mobBox we only need an EIP-712 permit,
  // so we don't have to check if we have approved jump to spend the token
  return {
    ...trait,
    execute: batchExecute,
    approveCallback: !zapIn ? null : props.approveCallback,
    mobApproveCallback,
  }
}

export default useMobTrait
