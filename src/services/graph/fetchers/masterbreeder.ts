import {
  masterBreederV1PairAddressesQuery,
  masterBreederV1KangaPerBlockQuery,
  masterBreederV1TotalAllocPointQuery,
  masterBreederV2PairAddressesQuery,
  miniBreederPairAddressesQuery,
  miniBreederPoolsQuery,
  poolsQuery,
  poolsV2Query,
} from '../queries'

import { ChainId } from '@kangafinance/sdk'
import { GRAPH_HOST } from '../constants'
import { getTokenSubset } from './exchange'
import { request } from 'graphql-request'

export const MINIBREEDER = {
  [ChainId.MATIC]: 'kanga/matic-minibreeder',
  [ChainId.XDAI]: 'matthewlilley/xdai-minibreeder',
  [ChainId.HARMONY]: 'kanga/harmony-minibreeder',
  [ChainId.ARBITRUM]: 'kanga/arbitrum-minibreeder',
}

export const miniBreeder = async (query, chainId = ChainId.MAINNET, variables = undefined) =>
  request(`${GRAPH_HOST[chainId]}/subgraphs/name/${MINIBREEDER[chainId]}`, query, variables)

export const MASTERBREEDER_V2 = {
  [ChainId.MAINNET]: 'kanga/master-breederv2',
}

export const masterBreederV2 = async (query, chainId = ChainId.MAINNET, variables = undefined) =>
  request(`${GRAPH_HOST[chainId]}/subgraphs/name/${MASTERBREEDER_V2[chainId]}`, query, variables)

export const MASTERBREEDER_V1 = {
  [ChainId.MAINNET]: 'kanga/master-breeder',
}

export const masterBreederV1 = async (query, chainId = ChainId.MAINNET, variables = undefined) =>
  request(`${GRAPH_HOST[chainId]}/subgraphs/name/${MASTERBREEDER_V1[chainId]}`, query, variables)

export const getMasterBreederV1TotalAllocPoint = async () => {
  const {
    masterBreeder: { totalAllocPoint },
  } = await masterBreederV1(masterBreederV1TotalAllocPointQuery)
  return totalAllocPoint
}

export const getMasterBreederV1KangaPerBlock = async () => {
  const {
    masterBreeder: { kangaPerBlock },
  } = await masterBreederV1(masterBreederV1KangaPerBlockQuery)
  return kangaPerBlock / 1e18
}

export const getMasterBreederV1Farms = async (variables = undefined) => {
  const { pools } = await masterBreederV1(poolsQuery, undefined, variables)
  return pools
}

export const getMasterBreederV1PairAddreses = async () => {
  const { pools } = await masterBreederV1(masterBreederV1PairAddressesQuery)
  return pools
}

export const getMasterBreederV2Farms = async (variables = undefined) => {
  const { pools } = await masterBreederV2(poolsV2Query, undefined, variables)

  const tokens = await getTokenSubset(ChainId.MAINNET, {
    tokenAddresses: Array.from(pools.map((pool) => pool.rewarder.rewardToken)),
  })

  return pools.map((pool) => ({
    ...pool,
    rewardToken: {
      ...tokens.find((token) => token.id === pool.rewarder.rewardToken),
    },
  }))
}

export const getMasterBreederV2PairAddreses = async () => {
  const { pools } = await masterBreederV2(masterBreederV2PairAddressesQuery)
  return pools
}

export const getMiniBreederFarms = async (chainId = ChainId.MAINNET, variables = undefined) => {
  const { pools } = await miniBreeder(miniBreederPoolsQuery, chainId, variables)
  return pools
}

export const getMiniBreederPairAddreses = async (chainId = ChainId.MAINNET) => {
  console.debug('getMiniBreederPairAddreses')
  const { pools } = await miniBreeder(miniBreederPairAddressesQuery, chainId)
  return pools
}
