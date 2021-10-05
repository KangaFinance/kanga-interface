import { useMobMasterContractAllowed } from '../state/mob/hooks'
import { useActiveWeb3React, useMobContract } from './index'
import { useAllTransactions, useTransactionAdder } from '../state/transactions/hooks'
import { useCallback, useMemo, useState } from 'react'
import { signMasterContractApproval } from '../entities/TroopMaker'
import { Contract } from '@ethersproject/contracts'
import { AddressZero, HashZero } from '@ethersproject/constants'
import { splitSignature } from '@ethersproject/bytes'

export enum MobApprovalState {
  UNKNOWN,
  NOT_APPROVED,
  PENDING,
  FAILED,
  APPROVED,
}

export enum MobApproveOutcome {
  SUCCESS,
  REJECTED,
  FAILED,
  NOT_READY,
}

const useMobHasPendingApproval = (masterContract: string, account: string, contractName?: string) => {
  const allTransactions = useAllTransactions()
  return useMemo(
    () =>
      typeof masterContract === 'string' &&
      typeof account === 'string' &&
      Object.keys(allTransactions).some((hash) => {
        const tx = allTransactions[hash]
        if (!tx) return false
        if (tx.receipt) {
          return false
        } else {
          const summary = tx.summary
          if (!summary) return false
          return summary === `Approving ${contractName} Master Contract`
        }
      }),
    [allTransactions, account, masterContract]
  )
}

export interface MobPermit {
  outcome: MobApproveOutcome
  signature?: { v: number; r: string; s: string }
  data?: string
}

export interface MobMasterApproveCallback {
  approvalState: MobApprovalState
  approve: () => Promise<void>
  getPermit: () => Promise<MobPermit>
  permit: MobPermit
}

export interface MobMasterApproveCallbackOptions {
  otherMobContract?: Contract | null
  contractName?: string
  functionFragment?: string
}

const useMobMasterApproveCallback = (
  masterContract: string,
  { otherMobContract, contractName, functionFragment }: MobMasterApproveCallbackOptions
): MobMasterApproveCallback => {
  const { account, chainId, library } = useActiveWeb3React()
  const mobContract = useMobContract()
  const addTransaction = useTransactionAdder()
  const currentAllowed = useMobMasterContractAllowed(masterContract, account || AddressZero)
  const pendingApproval = useMobHasPendingApproval(masterContract, account, contractName)
  const [permit, setPermit] = useState<MobPermit>(null)

  const approvalState: MobApprovalState = useMemo(() => {
    if (permit) return MobApprovalState.APPROVED
    if (pendingApproval) return MobApprovalState.PENDING

    // We might not have enough data to know whether or not we need to approve
    if (currentAllowed === undefined) return MobApprovalState.UNKNOWN
    if (!masterContract || !account) return MobApprovalState.UNKNOWN
    if (!currentAllowed) return MobApprovalState.NOT_APPROVED

    return MobApprovalState.APPROVED
  }, [account, currentAllowed, masterContract, pendingApproval, permit])

  const getPermit = useCallback(async () => {
    if (approvalState !== MobApprovalState.NOT_APPROVED) {
      console.error('approve was called unnecessarily')
      return
    }

    if (!masterContract) {
      console.error('masterContract is null')
      return
    }

    if (!account) {
      console.error('no account')
      return
    }

    try {
      const signature = await signMasterContractApproval(mobContract, masterContract, account, library, true, chainId)

      const { v, r, s } = splitSignature(signature)
      const permit = {
        outcome: MobApproveOutcome.SUCCESS,
        signature: { v, r, s },
        data: (otherMobContract || mobContract)?.interface?.encodeFunctionData(
          functionFragment || 'setMasterContractApproval',
          [account, masterContract, true, v, r, s]
        ),
      }

      setPermit(permit)
      return permit
    } catch (e) {
      return {
        outcome: e.code === 4001 ? MobApproveOutcome.REJECTED : MobApproveOutcome.FAILED,
      }
    }
  }, [account, approvalState, mobContract, chainId, functionFragment, library, masterContract, otherMobContract])

  const approve = useCallback(async () => {
    try {
      const tx = await mobContract?.setMasterContractApproval(account, masterContract, true, 0, HashZero, HashZero)

      return addTransaction(tx, {
        summary: `Approving ${contractName} Master Contract`,
      })
    } catch (e) {}
  }, [account, addTransaction, mobContract, contractName, masterContract])

  return {
    approvalState,
    approve,
    getPermit,
    permit,
  }
}

export default useMobMasterApproveCallback
