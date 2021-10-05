import { useActiveWeb3React, useKangaContract } from '../../hooks'

import { BigNumber } from '@ethersproject/bignumber'


import { Breeder } from './enum'
import { Zero } from '@ethersproject/constants'
import { useCallback } from 'react'
import { useBreederContract } from './hooks'

export default function useMasterBreeder(breeder: Breeder) {
  const { account } = useActiveWeb3React()

  const kanga = useKangaContract()

  const contract = useBreederContract(breeder)

  // Deposit
  const deposit = useCallback(
    async (pid: number, amount: BigNumber) => {
      try {
        let tx

        if (breeder === Breeder.MASTERBREEDER) {
          tx = await contract?.deposit(pid, amount)
        } else {
          tx = await contract?.deposit(pid, amount, account)
        }

        return tx
      } catch (e) {
        console.error(e)
        return e
      }
    },
    [account, breeder, contract]
  )

  // Withdraw
  const withdraw = useCallback(
    async (pid: number, amount: BigNumber) => {
      try {
        let tx

        if (breeder === Breeder.MASTERBREEDER) {
          tx = await contract?.withdraw(pid, amount)
        } else {
          tx = await contract?.withdraw(pid, amount, account)
        }

        return tx
      } catch (e) {
        console.error(e)
        return e
      }
    },
    [account, breeder, contract]
  )

  const harvest = useCallback(
    async (pid: number) => {
      try {
        let tx

        if (breeder === Breeder.MASTERBREEDER) {
          tx = await contract?.deposit(pid, Zero)
        } else if (breeder === Breeder.MASTERBREEDER_V2) {
          const pendingKanga = await contract?.pendingKanga(pid, account)

          const balanceOf = await kanga?.balanceOf(contract?.address)

          // If MasterBreederV2 doesn't have enough kanga to harvest, batch in a harvest.
          if (pendingKanga.gt(balanceOf)) {
            tx = await contract?.batch(
              [
                contract?.interface?.encodeFunctionData('harvestFromMasterBreeder'),
                contract?.interface?.encodeFunctionData('harvest', [pid, account]),
              ],
              true
            )
          } else {
            tx = await contract?.harvest(pid, account)
          }
        } else if (breeder === Breeder.MINIBREEDER) {
          tx = await contract?.harvest(pid, account)
        }

        return tx
      } catch (e) {
        console.error(e)
        return e
      }
    },
    [account, breeder, contract, kanga]
  )

  return { deposit, withdraw, harvest }
}
