import { useCallback, useEffect, useMemo, useState } from 'react'
import { useKmobContract, useBillabongContract, useKangaContract } from './useContract'

import { BalanceProps } from './useTokenBalance'
import Fraction from '../entities/Fraction'
import { ethers } from 'ethers'
import { useActiveWeb3React } from './useActiveWeb3React'
import { useTransactionAdder } from '../state/transactions/hooks'
import { ApprovalState } from './useApproveCallback'

import { BigNumber } from '@ethersproject/bignumber'


const useKmob = (kanga: boolean) => {
  const { account } = useActiveWeb3React()
  const addTransaction = useTransactionAdder()
  const kangaContract = useKangaContract(true)
  const billabongContract = useBillabongContract(true)
  const kmobContract = useKmobContract(true)
  const [pendingApproval, setPendingApproval] = useState(false)

  const [allowance, setAllowance] = useState('0')
  const fetchAllowance = useCallback(async () => {
    if (account) {
      try {
        let allowance
        if (kanga) {
          allowance = await kangaContract?.allowance(account, kmobContract?.address)
        } else {
          allowance = await billabongContract?.allowance(account, kmobContract?.address)
        }

        const formatted = Fraction.from(BigNumber.from(allowance), BigNumber.from(10).pow(18)).toString()
        setAllowance(formatted)
      } catch (error) {
        setAllowance('0')
      }
    }
  }, [account, kanga, kangaContract, kmobContract?.address, billabongContract])

  useEffect(() => {
    if (account && kmobContract) {
      if ((kanga && kangaContract) || (!kanga && billabongContract)) {
        fetchAllowance()
      }
    }

    const refreshInterval = setInterval(fetchAllowance, 10000)
    return () => clearInterval(refreshInterval)
  }, [account, kmobContract, fetchAllowance, kangaContract, billabongContract, kanga])

  const approvalState: ApprovalState = useMemo(() => {
    if (!account) return ApprovalState.UNKNOWN
    if (pendingApproval) return ApprovalState.PENDING
    if (!allowance || Number(allowance) === 0) return ApprovalState.NOT_APPROVED

    return ApprovalState.APPROVED
  }, [account, allowance, pendingApproval])

  const approve = useCallback(async () => {
    try {
      setPendingApproval(true)

      let tx
      if (kanga) {
        tx = await kangaContract?.approve(kmobContract?.address, ethers.constants.MaxUint256.toString())
      } else {
        tx = await billabongContract?.approve(kmobContract?.address, ethers.constants.MaxUint256.toString())
      }

      addTransaction(tx, { summary: 'Approve' })
      await tx.wait()
      return tx
    } catch (e) {
      return e
    } finally {
      setPendingApproval(false)
    }
  }, [kanga, addTransaction, kangaContract, kmobContract?.address, billabongContract])

  const kmob = useCallback(
    async (amount: BalanceProps | undefined) => {
      if (amount?.value) {
        try {
          const tx = await kmobContract?.kmob(account, amount?.value)
          addTransaction(tx, { summary: 'Enter Kmob' })
          return tx
        } catch (e) {
          return e
        }
      }
    },
    [account, addTransaction, kmobContract]
  )

  const unkmob = useCallback(
    async (amount: BalanceProps | undefined) => {
      if (amount?.value) {
        try {
          const tx = await kmobContract?.unkmob(account, amount?.value)
          addTransaction(tx, { summary: 'Leave Kmob' })
          return tx
        } catch (e) {
          return e
        }
      }
    },
    [account, addTransaction, kmobContract]
  )

  const kmobKanga = useCallback(
    async (amount: BalanceProps | undefined) => {
      if (amount?.value) {
        try {
          const tx = await kmobContract?.kmobKanga(account, amount?.value)
          addTransaction(tx, { summary: 'Enter Kmob' })
          return tx
        } catch (e) {
          return e
        }
      }
    },
    [account, addTransaction, kmobContract]
  )

  const unkmobKanga = useCallback(
    async (amount: BalanceProps | undefined) => {
      if (amount?.value) {
        try {
          const tx = await kmobContract?.unkmobKanga(account, amount?.value)
          addTransaction(tx, { summary: 'Leave Kmob' })
          return tx
        } catch (e) {
          return e
        }
      }
    },
    [account, addTransaction, kmobContract]
  )

  return {
    approvalState,
    approve,
    kmob,
    unkmob,
    kmobKanga,
    unkmobKanga,
  }
}

export default useKmob
