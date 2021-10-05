import { BigNumber } from '@ethersproject/bignumber'


import { WNATIVE } from '@kangafinance/sdk'
import { ethers } from 'ethers'
import { useActiveWeb3React } from './useActiveWeb3React'
import { useMobContract } from './useContract'
import { useCallback } from 'react'
import { useTransactionAdder } from '../state/transactions/hooks'

function useMob() {
  const { account, chainId } = useActiveWeb3React()

  const addTransaction = useTransactionAdder()
  const mobContract = useMobContract()

  const deposit = useCallback(
    async (tokenAddress: string, value: BigNumber) => {
      if (value && chainId) {
        try {
          const tokenAddressChecksum = ethers.utils.getAddress(tokenAddress)
          if (tokenAddressChecksum === WNATIVE[chainId].address) {
            const tx = await mobContract?.deposit(ethers.constants.AddressZero, account, account, value, 0, {
              value,
            })
            return addTransaction(tx, { summary: 'Deposit to Mob' })
          } else {
            const tx = await mobContract?.deposit(tokenAddressChecksum, account, account, value, 0)
            return addTransaction(tx, { summary: 'Deposit to Mob' })
          }
        } catch (e) {
          console.error('mob deposit error:', e)
          return e
        }
      }
    },
    [account, addTransaction, mobContract, chainId]
  )

  const withdraw = useCallback(
    // todo: this should be updated with BigNumber as opposed to string
    async (tokenAddress: string, value: BigNumber) => {
      if (value && chainId) {
        try {
          const tokenAddressChecksum = ethers.utils.getAddress(tokenAddress)
          const tx = await mobContract?.withdraw(
            tokenAddressChecksum === WNATIVE[chainId].address
              ? '0x0000000000000000000000000000000000000000'
              : tokenAddressChecksum,
            account,
            account,
            value,
            0
          )
          return addTransaction(tx, { summary: 'Withdraw from Mob' })
        } catch (e) {
          console.error('mob withdraw error:', e)
          return e
        }
      }
    },
    [account, addTransaction, mobContract, chainId]
  )

  return { deposit, withdraw }
}

export default useMob
