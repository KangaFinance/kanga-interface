import { useCallback, useEffect, useState } from 'react'
import { useBillabongContract, useKangaContract } from './useContract'

import Fraction from '../entities/Fraction'
import { BigNumber } from '@ethersproject/bignumber'


import { MaxUint256 } from '@ethersproject/constants'
import { parseUnits } from '@ethersproject/units'
import { useActiveWeb3React } from './useActiveWeb3React'
import { useTransactionAdder } from '../state/transactions/hooks'

const useBillabong = () => {
  const { account } = useActiveWeb3React()
  const addTransaction = useTransactionAdder()
  const kangaContract = useKangaContract(true) // withSigner
  const billabongContract = useBillabongContract(true) // withSigner

  const [allowance, setAllowance] = useState('0')

  const fetchAllowance = useCallback(async () => {
    if (account) {
      try {
        const allowance = await kangaContract?.allowance(account, billabongContract?.address)
        const formatted = Fraction.from(BigNumber.from(allowance), BigNumber.from(10).pow(18)).toString()
        setAllowance(formatted)
      } catch (error) {
        setAllowance('0')
        throw error
      }
    }
  }, [account, billabongContract, kangaContract])

  useEffect(() => {
    if (account && billabongContract && kangaContract) {
      fetchAllowance()
    }
    const refreshInterval = setInterval(fetchAllowance, 10000)
    return () => clearInterval(refreshInterval)
  }, [account, billabongContract, fetchAllowance, kangaContract])

  const approve = useCallback(async () => {
    try {
      const tx = await kangaContract?.approve(billabongContract?.address, MaxUint256.toString())
      return addTransaction(tx, { summary: 'Approve' })
    } catch (e) {
      return e
    }
  }, [addTransaction, billabongContract, kangaContract])

  const enter = useCallback(
    // todo: this should be updated with BigNumber as opposed to string
    async (amount: string) => {
      try {
        const tx = await billabongContract?.enter(parseUnits(amount))
        return addTransaction(tx, { summary: 'Enter Billabong' })
      } catch (e) {
        return e
      }
    },
    [addTransaction, billabongContract]
  )

  const leave = useCallback(
    // todo: this should be updated with BigNumber as opposed to string
    async (amount: string) => {
      try {
        const tx = await billabongContract?.leave(parseUnits(amount))
        return addTransaction(tx, { summary: 'Leave Billabong' })
      } catch (e) {
        console.error(e)
        return e
      }
    },
    [addTransaction, billabongContract]
  )

  return { allowance, approve, enter, leave }
}

export default useBillabong
