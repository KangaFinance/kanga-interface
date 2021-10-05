import {
  ChainId,
  CurrencyAmount,
  JSBI,
  MASTERBREEDER_ADDRESS,
  MASTERBREEDER_V2_ADDRESS,
  MINIBREEDER_ADDRESS,
} from '@kangafinance/sdk'
import { Breeder } from './enum'
import { NEVER_RELOAD, useSingleCallResult, useSingleContractMultipleData } from '../../state/multicall/hooks'
import { Dispatch, useCallback, useEffect, useMemo, useState } from 'react'
import { useMasterBreederContract, useMasterBreederV2Contract, useMiniBreederContract } from '../../hooks/useContract'

import { Contract } from '@ethersproject/contracts'
import { KANGA } from '../../config/tokens'
import { Zero } from '@ethersproject/constants'
import concat from 'lodash/concat'
import { useActiveWeb3React } from '../../hooks/useActiveWeb3React'
import zip from 'lodash/zip'

export function useBreederContract(breeder: Breeder) {
  const masterBreederContract = useMasterBreederContract()
  const masterBreederV2Contract = useMasterBreederV2Contract()
  const miniBreederContract = useMiniBreederContract()
  const contracts = useMemo(
    () => ({
      [Breeder.MASTERBREEDER]: masterBreederContract,
      [Breeder.MASTERBREEDER_V2]: masterBreederV2Contract,
      [Breeder.MINIBREEDER]: miniBreederContract,
    }),
    [masterBreederContract, masterBreederV2Contract, miniBreederContract]
  )
  return useMemo(() => {
    return contracts[breeder]
  }, [contracts, breeder])
}

const BREEDERS = {
  [ChainId.MAINNET]: [Breeder.MASTERBREEDER, Breeder.MASTERBREEDER_V2],
  [ChainId.MATIC]: [Breeder.MINIBREEDER],
}

export function useBreederContracts(breeders: Breeder[]) {
  const masterBreederContract = useMasterBreederContract()
  const masterBreederV2Contract = useMasterBreederV2Contract()
  const miniBreederContract = useMiniBreederContract()
  const contracts = useMemo(
    () => ({
      [Breeder.MASTERBREEDER]: masterBreederContract,
      [Breeder.MASTERBREEDER_V2]: masterBreederV2Contract,
      [Breeder.MINIBREEDER]: miniBreederContract,
    }),
    [masterBreederContract, masterBreederV2Contract, miniBreederContract]
  )
  return breeders.map((breeder) => contracts[breeder])
}

export function useUserInfo(farm, token) {
  const { account } = useActiveWeb3React()

  const contract = useBreederContract(farm.breeder)

  const args = useMemo(() => {
    if (!account) {
      return
    }
    return [String(farm.id), String(account)]
  }, [farm, account])

  const result = useSingleCallResult(args ? contract : null, 'userInfo', args)?.result

  const value = result?.[0]

  const amount = value ? JSBI.BigInt(value.toString()) : undefined

  return amount ? CurrencyAmount.fromRawAmount(token, amount) : undefined
}

export function usePendingKanga(farm) {
  const { account, chainId } = useActiveWeb3React()

  const contract = useBreederContract(farm.breeder)

  const args = useMemo(() => {
    if (!account) {
      return
    }
    return [String(farm.id), String(account)]
  }, [farm, account])

  const result = useSingleCallResult(args ? contract : null, 'pendingKanga', args)?.result

  const value = result?.[0]

  const amount = value ? JSBI.BigInt(value.toString()) : undefined

  return amount ? CurrencyAmount.fromRawAmount(KANGA[chainId], amount) : undefined
}

export function usePendingToken(farm, contract) {
  const { account } = useActiveWeb3React()

  const args = useMemo(() => {
    if (!account || !farm) {
      return
    }
    return [String(farm.pid), String(account)]
  }, [farm, account])

  const pendingTokens = useSingleContractMultipleData(
    args ? contract : null,
    'pendingTokens',
    args.map((arg) => [...arg, '0'])
  )

  return useMemo(() => pendingTokens, [pendingTokens])
}

export function useBreederPositions(contract?: Contract | null, rewarder?: Contract | null, chainId = undefined) {
  const { account } = useActiveWeb3React()

  const numberOfPools = useSingleCallResult(contract ? contract : null, 'poolLength', undefined, NEVER_RELOAD)
    ?.result?.[0]

  const args = useMemo(() => {
    if (!account || !numberOfPools) {
      return
    }
    return [...Array(numberOfPools.toNumber()).keys()].map((pid) => [String(pid), String(account)])
  }, [numberOfPools, account])

  const pendingKanga = useSingleContractMultipleData(args ? contract : null, 'pendingKanga', args)

  const userInfo = useSingleContractMultipleData(args ? contract : null, 'userInfo', args)

  // const pendingTokens = useSingleContractMultipleData(
  //     rewarder,
  //     'pendingTokens',
  //     args.map((arg) => [...arg, '0'])
  // )

  const getBreeder = useCallback(() => {
    if (MASTERBREEDER_ADDRESS[chainId] === contract.address) {
      return Breeder.MASTERBREEDER
    } else if (MASTERBREEDER_V2_ADDRESS[chainId] === contract.address) {
      return Breeder.MASTERBREEDER_V2
    } else if (MINIBREEDER_ADDRESS[chainId] === contract.address) {
      return Breeder.MINIBREEDER
    }
  }, [chainId, contract])

  return useMemo(() => {
    if (!pendingKanga || !userInfo) {
      return []
    }
    return zip(pendingKanga, userInfo)
      .map((data, i) => ({
        id: args[i][0],
        pendingKanga: data[0].result?.[0] || Zero,
        amount: data[1].result?.[0] || Zero,
        breeder: getBreeder(),
        // pendingTokens: data?.[2]?.result,
      }))
      .filter(({ pendingKanga, amount }) => {
        return (pendingKanga && !pendingKanga.isZero()) || (amount && !amount.isZero())
      })
  }, [args, getBreeder, pendingKanga, userInfo])
}

export function usePositions(chainId = undefined) {
  const [masterBreederV1Positions, masterBreederV2Positions, miniBreederPositions] = [
    useBreederPositions(useMasterBreederContract(), undefined, chainId),
    useBreederPositions(useMasterBreederV2Contract(), undefined, chainId),
    useBreederPositions(useMiniBreederContract(), undefined, chainId),
  ]
  return concat(masterBreederV1Positions, masterBreederV2Positions, miniBreederPositions)
}

/*
  Currently expensive to render farm list item. The infinite scroll is used to
  to minimize this impact. This hook pairs with it, keeping track of visible
  items and passes this to <InfiniteScroll> component.
*/
export function useInfiniteScroll(items: any[]): [number, Dispatch<number>] {
  const [itemsDisplayed, setItemsDisplayed] = useState(10)
  useEffect(() => setItemsDisplayed(10), [items.length])
  return [itemsDisplayed, setItemsDisplayed]
}
