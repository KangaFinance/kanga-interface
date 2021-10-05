import { Feature, chainsWithFeature } from '../../../functions/feature'
import {
  useFarms,
  useMobUserTokens as useGetMobUserTokens,
  useUserTroopPairs as useGetUserTroopPairs,
  useTroopPairs,
  useLiquidityPositions,
  useNativePrice,
  useKangaPairs,
  useTokens,
} from '../../../services/graph'

import { ChainId } from '@kangafinance/sdk'
import { getFraction } from '../../../functions'
import { uniq } from 'lodash'
import { useActiveWeb3React } from '../../../hooks'
import { useAssets } from './../../../services/zerion/hooks'
import { useMemo } from 'react'
import { usePositions } from '../../boomer/hooks'

export function useAllUserPairs() {
  let pairs = []
  for (const chainId of chainsWithFeature(Feature.AMM)) {
    pairs = [...pairs, ...useUserPairs(ChainId[chainId])]
  }
  return pairs
}

export function useUserPairs(chainId = undefined) {
  const { chainId: chainIdSelected, account } = useActiveWeb3React()
  chainId = chainId ?? chainIdSelected

  const userPairs = useLiquidityPositions({ user: account, chainId })
  const pairsFiltered = useKangaPairs({
    subset: userPairs.map((pair) => pair.pair.id),
    chainId,
    shouldFetch: !!userPairs,
  })
  const userPairsFormatted = useMemo(() => {
    return pairsFiltered && userPairs
      ? pairsFiltered.map((pair) => {
          const userPair = userPairs.find((p) => p.pair.id === pair.id)

          return {
            ...pair,
            userBalanceToken: Number(userPair.liquidityTokenBalance),
            userBalanceUSD: (pair.reserveUSD / pair.totalSupply) * userPair.liquidityTokenBalance,
            chain: ChainId[chainId],
          }
        })
      : []
  }, [pairsFiltered, chainId, userPairs])

  return userPairsFormatted
}

export function useAllUserFarms() {
  let farms = []
  for (const chainId of chainsWithFeature(Feature.LIQUIDITY_MINING)) {
    farms = [...farms, ...useUserFarms(ChainId[chainId])]
  }
  return farms
}

export function useUserFarms(chainId = undefined) {
  const { chainId: chainIdSelected } = useActiveWeb3React()
  chainId = chainId ?? chainIdSelected

  const userPositions = usePositions(chainId)
  const farms = useFarms({ chainId })

  const farmAddresses = useMemo(() => farms.map((farm) => farm.pair), [farms])

  const kangaPairs = useKangaPairs({ subset: farmAddresses, chainId, shouldFetch: !!farmAddresses })
  const troopPairs = useTroopPairs({ subset: farmAddresses, chainId, shouldFetch: !!farmAddresses })

  const nativePrice = useNativePrice({ chainId })

  const userFarmsFormatted = useMemo(
    () =>
      userPositions && farms && (kangaPairs || troopPairs)
        ? userPositions
            .map((position) => {
              const farm = farms.find((f) => f.breeder === position.breeder && f.id === position.id)
              if (!farm) return undefined
              const kangaPair = kangaPairs?.find((pair) => pair.id === farm.pair)
              const troopPair = troopPairs?.find((pair) => pair.id === farm.pair)

              if (!kangaPair && !troopPair) return undefined

              return {
                ...farm,
                type: kangaPair ? 'lp' : troopPair ? 'troop' : 'unknown',
                userStakedToken: position.amount / 1e18,
                userStakedUSD: kangaPair
                  ? ((kangaPair.reserveUSD / kangaPair.totalSupply) * position.amount) / 1e18
                  : (position.amount / getFraction(troopPair) / 10 ** troopPair.token0.decimals) *
                    troopPair.token0.derivedETH *
                    nativePrice,
                chain: ChainId[chainId],
              }
            })
            .filter((position) => position)
        : [],
    [userPositions, farms, kangaPairs, troopPairs, chainId, nativePrice]
  )
  return userFarmsFormatted
}

export function useAllMobUserTokens() {
  let tokens = []
  for (const chainId of chainsWithFeature(Feature.MOB)) {
    tokens = [...tokens, ...useMobUserTokens(ChainId[chainId])]
  }
  return tokens
}

export function useMobUserTokens(chainId = undefined) {
  const { chainId: chainIdSelected } = useActiveWeb3React()
  chainId = chainId ?? chainIdSelected

  const mobUserTokens = useGetMobUserTokens(undefined, chainId)

  const tokens = useTokens({ chainId })

  const nativePrice = useNativePrice({ chainId })

  return useMemo(() => {
    return mobUserTokens && tokens && nativePrice
      ? mobUserTokens.map((mobToken) => {
          const token = tokens.find((t) => t.id === mobToken.id)

          return {
            ...mobToken,
            valueUSD: (mobToken.amount * token?.derivedETH * nativePrice) / 10 ** token?.decimals ?? 0,
            chain: ChainId[chainId],
          }
        })
      : []
  }, [mobUserTokens, tokens, nativePrice, chainId])
}

export function useAllUserTroopPairs() {
  let pairs = []
  for (const chainId of chainsWithFeature(Feature.MOB)) {
    pairs = [...pairs, ...useUserTroopPairs(ChainId[chainId])]
  }
  return pairs
}

export function useUserTroopPairs(chainId = undefined) {
  const userTroopPairs = useGetUserTroopPairs(undefined, chainId)

  const troopTokenAddresses = useMemo(
    () =>
      userTroopPairs
        ? uniq([
            ...userTroopPairs.map((userPair) => userPair.pair.asset.id),
            ...userTroopPairs.map((userPair) => userPair.pair.collateral.id),
          ])
        : [],
    [userTroopPairs]
  )

  const tokens = useTokens({ subset: troopTokenAddresses, chainId, shouldFetch: !!troopTokenAddresses })

  const nativePrice = useNativePrice({ chainId })

  return useMemo(() => {
    return userTroopPairs && tokens && nativePrice
      ? userTroopPairs.map((userPair) => {
          const asset = tokens.find((t) => t.id === userPair.pair.asset.id)
          const collateral = tokens.find((t) => t.id === userPair.pair.collateral.id)

          const assetValueUSD = (userPair.assetAmount / 10 ** asset.decimals) * asset.derivedETH * nativePrice
          const borrowedValueUSD = (userPair.borrowedAmount / 10 ** asset.decimals) * asset.derivedETH * nativePrice
          const collateralValueUSD =
            (userPair.collateralAmount / 10 ** collateral.decimals) * collateral.derivedETH * nativePrice

          return {
            ...userPair,
            assetValueUSD,
            borrowedValueUSD,
            collateralValueUSD,
            valueUSD: assetValueUSD + collateralValueUSD - borrowedValueUSD,
            chain: ChainId[chainId],
          }
        })
      : []
  }, [userTroopPairs, tokens, nativePrice, chainId])
}

export function useUserAssets() {
  const assets = useAssets()

  return useMemo(() => {
    return assets
      ? assets
          .map((asset) => {
            const price = asset.price?.value ?? asset.value ?? 0
            return {
              token: asset.asset_code,
              symbol: asset.symbol,
              amount: asset.quantity,
              chain: asset.network,
              type: asset.type,
              valueUSD: (price * asset.quantity) / 10 ** asset.decimals,
            }
          })
          .filter((asset) => asset.valueUSD !== 0)
          .filter((asset) => asset.type !== 'kanga') // covered by useUserPairs
      : []
  }, [assets])
}
