import { Currency, CurrencyAmount, Token } from '@kangafinance/sdk'

import { useCallback } from 'react'
import { useBillabongContract } from './useContract'
import { useTransactionAdder } from '../state/transactions/hooks'

const useBillabong = () => {
  const addTransaction = useTransactionAdder()
  const billabongContract = useBillabongContract()

  const enter = useCallback(
    async (amount: CurrencyAmount<Token> | undefined) => {
      if (amount?.quotient) {
        try {
          const tx = await billabongContract?.enter(amount?.quotient.toString())
          return addTransaction(tx, { summary: 'Enter Billabong' })
        } catch (e) {
          return e
        }
      }
    },
    [addTransaction, billabongContract]
  )

  const leave = useCallback(
    async (amount: CurrencyAmount<Token> | undefined) => {
      if (amount?.quotient) {
        try {
          const tx = await billabongContract?.leave(amount?.quotient.toString())
          return addTransaction(tx, { summary: 'Leave Billabong' })
        } catch (e) {
          return e
        }
      }
    },
    [addTransaction, billabongContract]
  )

  return { enter, leave }
}

export default useBillabong
