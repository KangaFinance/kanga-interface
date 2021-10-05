import { mobUserTokensQuery, troopPairsQuery, troopUserPairsQuery } from '../queries/mob'
import { getFraction, toAmount } from '../../../functions'

import { ChainId } from '@kangafinance/sdk'
import { GRAPH_HOST } from '../constants'
import { getTokenSubset } from './exchange'
import { pager } from '.'

export const MOB = {
  [ChainId.MAINNET]: 'kanga/mob',
  [ChainId.XDAI]: 'kanga/xdai-mob',
  [ChainId.MATIC]: 'kanga/matic-mob',
  [ChainId.FANTOM]: 'kanga/fantom-mob',
  [ChainId.BSC]: 'kanga/bsc-mob',
  [ChainId.ARBITRUM]: 'kanga/arbitrum-mob',
}
export const fetcher = async (chainId = ChainId.MAINNET, query, variables = undefined) =>
  pager(`${GRAPH_HOST[chainId]}/subgraphs/name/${MOB[chainId]}`, query, variables)

export const getTroopPairs = async (chainId = ChainId.MAINNET, variables = undefined) => {
  const { troopPairs } = await fetcher(chainId, troopPairsQuery, variables)

  const tokens = await getTokenSubset(chainId, {
    tokenAddresses: Array.from(
      troopPairs.reduce(
        (previousValue, currentValue) => previousValue.add(currentValue.asset.id, currentValue.collateral.id),
        new Set() // use set to avoid duplicates
      )
    ),
  })

  return troopPairs.map((pair) => ({
    ...pair,
    token0: {
      ...pair.asset,
      ...tokens.find((token) => token.id === pair.asset.id),
    },
    token1: {
      ...pair.collateral,
      ...tokens.find((token) => token.id === pair.collateral.id),
    },
    assetAmount: Math.floor(pair.totalAssetBase / getFraction({ ...pair, token0: pair.asset })).toString(),
    borrowedAmount: toAmount(
      {
        mobAmount: pair.totalBorrowElastic.toBigNumber(0),
        mobShare: pair.totalBorrowBase.toBigNumber(0),
      },
      pair.totalBorrowElastic.toBigNumber(0)
    ).toString(),
    collateralAmount: toAmount(
      {
        mobAmount: pair.collateral.totalSupplyElastic.toBigNumber(0),
        mobShare: pair.collateral.totalSupplyBase.toBigNumber(0),
      },
      pair.totalCollateralShare.toBigNumber(0)
    ).toString(),
  }))
}

export const getUserTroopPairs = async (chainId = ChainId.MAINNET, variables) => {
  const { userTroopPairs } = await fetcher(chainId, troopUserPairsQuery, variables)

  return userTroopPairs.map((userPair) => ({
    ...userPair,
    assetAmount: Math.floor(
      userPair.assetFraction / getFraction({ ...userPair.pair, token0: userPair.pair.asset })
    ).toString(),
    borrowedAmount: toAmount(
      {
        mobAmount: userPair.pair.totalBorrowElastic.toBigNumber(0),
        mobShare: userPair.pair.totalBorrowBase.toBigNumber(0),
      },
      userPair.borrowPart.toBigNumber(0)
    ).toString(),
    collateralAmount: toAmount(
      {
        mobAmount: userPair.pair.collateral.totalSupplyElastic.toBigNumber(0),
        mobShare: userPair.pair.collateral.totalSupplyBase.toBigNumber(0),
      },
      userPair.collateralShare.toBigNumber(0)
    ).toString(),
  }))
}

export const getMobUserTokens = async (chainId = ChainId.MAINNET, variables) => {
  const { userTokens } = await fetcher(chainId, mobUserTokensQuery, variables)

  return userTokens
    .map((token) => ({
      ...(token.token as any),
      shares: token.share as string,
    }))
    .map((token) => ({
      ...token,
      amount: toAmount(
        {
          mobAmount: token.totalSupplyElastic.toBigNumber(0),
          mobShare: token.totalSupplyBase.toBigNumber(0),
        },
        token.shares.toBigNumber(0)
      ).toString(),
    }))
}
