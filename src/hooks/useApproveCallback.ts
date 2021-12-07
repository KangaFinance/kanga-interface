import {
  ARCHER_ROUTER_ADDRESS,
  Currency,
  CurrencyAmount,
  Percent,
  ROUTER_ADDRESS,
  TradeType,
  Trade as V2Trade,
} from '@kangafinance/sdk'
import { useCallback, useMemo } from 'react'
import { useHasPendingApproval, useTransactionAdder } from '../state/transactions/hooks'

import { MaxUint256 } from '@ethersproject/constants'
import { TransactionResponse } from '@ethersproject/providers'
import { calculateGasMargin } from '../functions/trade'
import { useActiveWeb3React } from './useActiveWeb3React'
import { useTokenAllowance } from './useTokenAllowance'
import { useTokenContract } from './useContract'

export enum ApprovalState {
  UNKNOWN = 'UNKNOWN',
  NOT_APPROVED = 'NOT_APPROVED',
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
}

// returns a variable indicating the state of the approval and a function which approves if necessary or early returns
export function useApproveCallback(
  amountToApprove?: CurrencyAmount<Currency>,
  spender?: string
): [ApprovalState, () => Promise<void>] {
  // console.log(`amountToApprove: ${JSON.stringify(amountToApprove)}`)
  // console.log(`spender: ${spender}`)
  const { account } = useActiveWeb3React()
  console.log(`account: ${account}`)
  const token = amountToApprove?.currency?.isToken ? amountToApprove.currency : undefined
  // console.log(`amountToApprove: ${JSON.stringify(amountToApprove)}`)
  // console.log(`token: ${JSON.stringify(token)}`)
  const currentAllowance = useTokenAllowance(token, account ?? undefined, spender)
  console.log(`currentAllowance: ${JSON.stringify(currentAllowance)}`)
  const pendingApproval = useHasPendingApproval(token?.address, spender)
  console.log(`pendingApproval: ${JSON.stringify(pendingApproval)}`)

  // check the current approval status
  const approvalState: ApprovalState = useMemo(() => {
    console.log(`!amountToApprove || !spender`)
    if (!amountToApprove || !spender) return ApprovalState.UNKNOWN
    console.log(`amountToApprove.currency.isNative`)
    if (amountToApprove.currency.isNative) return ApprovalState.APPROVED
    // we might not have enough data to know whether or not we need to approve
    console.log(`!currentAllowance`)
    if (!currentAllowance) return ApprovalState.UNKNOWN

    console.log(`currentAllowance.lessThan(amountToApprove)`)
    // amountToApprove will be defined if currentAllowance is
    return currentAllowance.lessThan(amountToApprove)
      ? pendingApproval
        ? ApprovalState.PENDING
        : ApprovalState.NOT_APPROVED
      : ApprovalState.APPROVED
  }, [amountToApprove, currentAllowance, pendingApproval, spender])

  const tokenContract = useTokenContract(token?.address)
  const addTransaction = useTransactionAdder()

  const approve = useCallback(async (): Promise<void> => {
    console.log(`approvalState: ${approvalState}`)
    if (approvalState !== ApprovalState.NOT_APPROVED) {
      console.error('approve was called unnecessarily for adding liquidity')
      return
    }
    if (!token) {
      console.error('no token')
      return
    }

    if (!tokenContract) {
      console.error('tokenContract is null')
      return
    }

    if (!amountToApprove) {
      console.error('missing amount to approve')
      return
    }

    if (!spender) {
      console.error('no spender')
      return
    }

    let useExact = false
    const estimatedGas = await tokenContract.estimateGas.approve(spender, MaxUint256).catch(() => {
      // general fallback for tokens who restrict approval amounts
      useExact = true
      return tokenContract.estimateGas.approve(spender, amountToApprove.quotient.toString())
    })

    return tokenContract
      .approve(spender, useExact ? amountToApprove.quotient.toString() : MaxUint256, {
        gasLimit: calculateGasMargin(estimatedGas),
      })
      .then((response: TransactionResponse) => {
        addTransaction(response, {
          summary: 'Approve ' + amountToApprove.currency.symbol,
          approval: { tokenAddress: token.address, spender: spender },
        })
      })
      .catch((error: Error) => {
        console.debug('Failed to approve token', error)
        throw error
      })
  }, [approvalState, token, tokenContract, amountToApprove, spender, addTransaction])

  return [approvalState, approve]
}

// wraps useApproveCallback in the context of a swap
export function useApproveCallbackFromTrade(
  trade: V2Trade<Currency, Currency, TradeType> | undefined,
  allowedSlippage: Percent,
  doArcher: boolean = false
) {
  const { chainId } = useActiveWeb3React()
  const amountToApprove = useMemo(
    () => (trade && trade.inputAmount.currency.isToken ? trade.maximumAmountIn(allowedSlippage) : undefined),
    [trade, allowedSlippage]
  )
  return useApproveCallback(
    amountToApprove,
    chainId
      ? trade instanceof V2Trade
        ? !doArcher
          ? ROUTER_ADDRESS[chainId]
          : ARCHER_ROUTER_ADDRESS[chainId]
        : undefined
      : undefined
  )
}
