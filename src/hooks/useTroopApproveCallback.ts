import TroopMaker, { signMasterContractApproval } from '../entities/TroopMaker'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { TROOP_ADDRESS } from '@kangafinance/sdk'
import { ethers } from 'ethers'
import { setTroopApprovalPending } from '../state/application/actions'
import { useActiveWeb3React } from './useActiveWeb3React'
import { useMobContract } from './useContract'
import { useMobMasterContractAllowed } from '../state/mob/hooks'
import { useDispatch } from 'react-redux'
import { useTroopApprovalPending } from '../state/application/hooks'
import { useTransactionAdder } from '../state/transactions/hooks'

export enum MobApprovalState {
  UNKNOWN,
  NOT_APPROVED,
  PENDING,
  FAILED,
  APPROVED,
}

export interface TroopPermit {
  account: string
  masterContract: string
  v: number
  r: string
  s: string
}

export enum MobApproveOutcome {
  SUCCESS,
  REJECTED,
  FAILED,
  NOT_READY,
}

export type MobApproveResult = {
  outcome: MobApproveOutcome
  permit?: TroopPermit
}

// returns a variable indicating the state of the approval and a function which approves if necessary or early returns
function useTroopApproveCallback(): [
  MobApprovalState,
  boolean,
  TroopPermit | undefined,
  () => void,
  (pair: any, execute: (maker: TroopMaker) => Promise<string>) => void
] {
  const { account, library, chainId } = useActiveWeb3React()
  const dispatch = useDispatch()
  const [approveTroopFallback, setApproveTroopFallback] = useState<boolean>(false)
  const [troopPermit, setTroopPermit] = useState<TroopPermit | undefined>(undefined)

  useEffect(() => {
    setTroopPermit(undefined)
  }, [account, chainId])

  const masterContract = chainId && TROOP_ADDRESS[chainId]

  const pendingApproval = useTroopApprovalPending()
  const currentAllowed = useMobMasterContractAllowed(masterContract, account || ethers.constants.AddressZero)
  const addTransaction = useTransactionAdder()

  // check the current approval status
  const approvalState: MobApprovalState = useMemo(() => {
    if (!masterContract) return MobApprovalState.UNKNOWN
    if (!currentAllowed && pendingApproval) return MobApprovalState.PENDING

    return currentAllowed ? MobApprovalState.APPROVED : MobApprovalState.NOT_APPROVED
  }, [masterContract, currentAllowed, pendingApproval])

  const mobContract = useMobContract()

  const approve = useCallback(async (): Promise<MobApproveResult> => {
    if (approvalState !== MobApprovalState.NOT_APPROVED) {
      console.error('approve was called unnecessarily')
      return { outcome: MobApproveOutcome.NOT_READY }
    }
    if (!masterContract) {
      console.error('no token')
      return { outcome: MobApproveOutcome.NOT_READY }
    }

    if (!mobContract) {
      console.error('no mob contract')
      return { outcome: MobApproveOutcome.NOT_READY }
    }

    if (!account) {
      console.error('no account')
      return { outcome: MobApproveOutcome.NOT_READY }
    }
    if (!library) {
      console.error('no library')
      return { outcome: MobApproveOutcome.NOT_READY }
    }

    try {
      const signature = await signMasterContractApproval(mobContract, masterContract, account, library, true, chainId)
      const { v, r, s } = ethers.utils.splitSignature(signature)
      return {
        outcome: MobApproveOutcome.SUCCESS,
        permit: { account, masterContract, v, r, s },
      }
    } catch (e) {
      return {
        outcome: e.code === 4001 ? MobApproveOutcome.REJECTED : MobApproveOutcome.FAILED,
      }
    }
  }, [approvalState, account, library, chainId, mobContract, masterContract])

  const onApprove = async function () {
    if (!approveTroopFallback) {
      const result = await approve()
      if (result.outcome === MobApproveOutcome.SUCCESS) {
        setTroopPermit(result.permit)
      } else if (result.outcome === MobApproveOutcome.FAILED) {
        setApproveTroopFallback(true)
      }
    } else {
      const tx = await mobContract?.setMasterContractApproval(
        account,
        masterContract,
        true,
        0,
        ethers.constants.HashZero,
        ethers.constants.HashZero
      )
      dispatch(setTroopApprovalPending('Approve Troop'))
      await tx.wait()
      dispatch(setTroopApprovalPending(''))
    }
  }

  const onMake = async function (pair: any, execute: (maker: TroopMaker) => Promise<string>) {
    const maker = new TroopMaker(pair, account, library, chainId)
    let summary
    if (approvalState === MobApprovalState.NOT_APPROVED && troopPermit) {
      maker.approve(troopPermit)
      summary = 'Approve Troop and ' + (await execute(maker))
    } else {
      summary = await execute(maker)
    }
    const result = await maker.make()
    if (result.success) {
      addTransaction(result.tx, { summary })
      setTroopPermit(undefined)
      await result.tx.wait()
    }
  }

  return [approvalState, approveTroopFallback, troopPermit, onApprove, onMake]
}

export default useTroopApproveCallback
