import {
  getMasterBreederV1Farms,
  getMasterBreederV1PairAddreses,
  getMasterBreederV1KangaPerBlock,
  getMasterBreederV1TotalAllocPoint,
  getMasterBreederV2Farms,
  getMasterBreederV2PairAddreses,
  getMiniBreederFarms,
  getMiniBreederPairAddreses,
} from '../fetchers'
import { useEffect, useMemo } from 'react'
import useSWR, { SWRConfiguration } from 'swr'

import { ChainId } from '@kangafinance/sdk'
import { Breeder } from '../../../features/boomer/enum'
import concat from 'lodash/concat'
import useActiveWeb3React from '../../../hooks/useActiveWeb3React'

export * from './mob'
export * from './blocks'
export * from './exchange'

export function useMasterBreederV1TotalAllocPoint(swrConfig = undefined) {
  const { chainId } = useActiveWeb3React()
  const shouldFetch = chainId && chainId === ChainId.MAINNET
  const { data } = useSWR(
    shouldFetch ? 'masterBreederV1TotalAllocPoint' : null,
    () => getMasterBreederV1TotalAllocPoint(),
    swrConfig
  )
  return data
}

export function useMasterBreederV1KangaPerBlock(swrConfig = undefined) {
  const { chainId } = useActiveWeb3React()
  const shouldFetch = chainId && chainId === ChainId.MAINNET
  const { data } = useSWR(
    shouldFetch ? 'masterBreederV1KangaPerBlock' : null,
    () => getMasterBreederV1KangaPerBlock(),
    swrConfig
  )
  return data
}

interface useFarmsProps {
  chainId: number
}

export function useMasterBreederV1Farms({ chainId }: useFarmsProps, swrConfig = undefined) {
  const shouldFetch = chainId && chainId === ChainId.MAINNET
  const { data } = useSWR(
    shouldFetch ? ['masterBreederV1Farms'] : null,
    () => getMasterBreederV1Farms(undefined),
    swrConfig
  )
  return useMemo(() => {
    if (!data) return []
    return data.map((data) => ({ ...data, breeder: Breeder.MASTERBREEDER }))
  }, [data])
}

export function useMasterBreederV2Farms({ chainId }: useFarmsProps, swrConfig: SWRConfiguration = undefined) {
  const shouldFetch = chainId && chainId === ChainId.MAINNET
  const { data } = useSWR(shouldFetch ? 'masterBreederV2Farms' : null, () => getMasterBreederV2Farms(), swrConfig)
  return useMemo(() => {
    if (!data) return []
    return data.map((data) => ({ ...data, breeder: Breeder.MASTERBREEDER_V2 }))
  }, [data])
}

export function useMiniBreederFarms({ chainId }: useFarmsProps, swrConfig: SWRConfiguration = undefined) {
  const shouldFetch = chainId && [ChainId.MATIC, ChainId.XDAI, ChainId.HARMONY, ChainId.ARBITRUM].includes(chainId)
  const { data } = useSWR(
    shouldFetch ? ['miniBreederFarms', chainId] : null,
    (_, chainId) => getMiniBreederFarms(chainId),
    swrConfig
  )
  return useMemo(() => {
    if (!data) return []
    return data.map((data) => ({ ...data, breeder: Breeder.MINIBREEDER }))
  }, [data])
}

export function useFarms({ chainId }: useFarmsProps, swrConfig: SWRConfiguration = undefined) {
  const masterBreederV1Farms = useMasterBreederV1Farms({ chainId })
  const masterBreederV2Farms = useMasterBreederV2Farms({ chainId })
  const miniBreederFarms = useMiniBreederFarms({ chainId })
  // useEffect(() => {
  //   console.log('debug', { masterBreederV1Farms, masterBreederV2Farms, miniBreederFarms })
  // }, [masterBreederV1Farms, masterBreederV2Farms, miniBreederFarms])
  return useMemo(
    () => concat(masterBreederV1Farms, masterBreederV2Farms, miniBreederFarms).filter((pool) => pool && pool.pair),
    [masterBreederV1Farms, masterBreederV2Farms, miniBreederFarms]
  )
}

export function useMasterBreederV1PairAddresses() {
  const { chainId } = useActiveWeb3React()
  const shouldFetch = chainId && chainId === ChainId.MAINNET
  const { data } = useSWR(shouldFetch ? ['masterBreederV1PairAddresses', chainId] : null, (_) =>
    getMasterBreederV1PairAddreses()
  )
  return useMemo(() => {
    if (!data) return []
    return data.map((data) => data.pair)
  }, [data])
}

export function useMasterBreederV2PairAddresses() {
  const { chainId } = useActiveWeb3React()
  const shouldFetch = chainId && chainId === ChainId.MAINNET
  const { data } = useSWR(shouldFetch ? ['masterBreederV2PairAddresses', chainId] : null, (_) =>
    getMasterBreederV2PairAddreses()
  )
  return useMemo(() => {
    if (!data) return []
    return data.map((data) => data.pair)
  }, [data])
}

export function useMiniBreederPairAddresses() {
  const { chainId } = useActiveWeb3React()
  const shouldFetch = chainId && [ChainId.MATIC, ChainId.XDAI, ChainId.HARMONY, ChainId.ARBITRUM].includes(chainId)
  const { data } = useSWR(shouldFetch ? ['miniBreederPairAddresses', chainId] : null, (_, chainId) =>
    getMiniBreederPairAddreses(chainId)
  )
  return useMemo(() => {
    if (!data) return []
    return data.map((data) => data.pair)
  }, [data])
}

export function useFarmPairAddresses() {
  const masterBreederV1PairAddresses = useMasterBreederV1PairAddresses()
  const masterBreederV2PairAddresses = useMasterBreederV2PairAddresses()
  const miniBreederPairAddresses = useMiniBreederPairAddresses()
  return useMemo(
    () => concat(masterBreederV1PairAddresses, masterBreederV2PairAddresses, miniBreederPairAddresses),
    [masterBreederV1PairAddresses, masterBreederV2PairAddresses, miniBreederPairAddresses]
  )
}
