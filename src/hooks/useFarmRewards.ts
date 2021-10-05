import { Breeder, PairType } from '../features/boomer/enum'
import {
  useAverageBlockTime,
  useBlock,
  useEthPrice,
  useFarms,
  useTroopPairs,
  useMasterBreederV1KangaPerBlock,
  useMasterBreederV1TotalAllocPoint,
  useMaticPrice,
  useNativePrice,
  useOnePrice,
  useStakePrice,
  useKangaPairs,
  useKangaPrice,
} from '../services/graph'

import { ChainId } from '@kangafinance/sdk'
import { getAddress } from '@ethersproject/address'
import useActiveWeb3React from './useActiveWeb3React'
import { useMemo } from 'react'
import { usePositions } from '../features/boomer/hooks'
import { aprToApy } from '../functions/convert/apyApr'

export default function useFarmRewards() {
  const { chainId } = useActiveWeb3React()

  const positions = usePositions(chainId)

  const block1w = useBlock({ daysAgo: 7 })

  const farms = useFarms({ chainId })
  const farmAddresses = useMemo(() => farms.map((farm) => farm.pair), [farms])
  const swapPairs = useKangaPairs({ subset: farmAddresses, shouldFetch: !!farmAddresses, chainId })
  const swapPairs1w = useKangaPairs({
    subset: farmAddresses,
    block: block1w,
    shouldFetch: !!block1w && !!farmAddresses,
    chainId,
  })
  const troopPairs = useTroopPairs({ subset: farmAddresses, shouldFetch: !!farmAddresses, chainId })

  const averageBlockTime = useAverageBlockTime()
  const masterBreederV1TotalAllocPoint = useMasterBreederV1TotalAllocPoint()
  const masterBreederV1KangaPerBlock = useMasterBreederV1KangaPerBlock()

  const [kangaPrice, ethPrice, maticPrice, stakePrice, onePrice] = [
    useKangaPrice(),
    useEthPrice(),
    useMaticPrice(),
    useStakePrice(),
    useOnePrice(),
  ]

  const blocksPerDay = 86400 / Number(averageBlockTime)

  const map = (pool) => {
    // TODO: Deal with inconsistencies between properties on subgraph
    pool.owner = pool?.owner || pool?.masterBreeder || pool?.miniBreeder
    pool.balance = pool?.balance || pool?.klpBalance

    const swapPair = swapPairs?.find((pair) => pair.id === pool.pair)
    const swapPair1w = swapPairs1w?.find((pair) => pair.id === pool.pair)
    const troopPair = troopPairs?.find((pair) => pair.id === pool.pair)

    const pair = swapPair || troopPair
    const pair1w = swapPair1w

    const type = swapPair ? PairType.SWAP : PairType.TROOP

    const blocksPerHour = 3600 / averageBlockTime

    function getRewards() {
      // TODO: Some subgraphs give kangaPerBlock & kangaPerSecond, and mcv2 gives nothing
      const kangaPerBlock =
        pool?.owner?.kangaPerBlock / 1e18 ||
        (pool?.owner?.kangaPerSecond / 1e18) * averageBlockTime ||
        masterBreederV1KangaPerBlock

      const rewardPerBlock = (pool.allocPoint / pool.owner.totalAllocPoint) * kangaPerBlock

      const defaultReward = {
        token: 'KANGA',
        icon: 'https://raw.githubusercontent.com/kangafinance/icons/master/token/kanga.jpg',
        rewardPerBlock,
        rewardPerDay: rewardPerBlock * blocksPerDay,
        rewardPrice: kangaPrice,
      }

      let rewards = [defaultReward]

      if (pool.breeder === Breeder.MASTERBREEDER_V2) {
        // override for mcv2...
        pool.owner.totalAllocPoint = masterBreederV1TotalAllocPoint

        const icon = ['0', '3', '4', '8'].includes(pool.id)
          ? `https://raw.githubusercontent.com/kangafinance/icons/master/token/${pool.rewardToken.symbol.toLowerCase()}.jpg`
          : `https://raw.githubusercontent.com/kangafinance/assets/master/blockchains/ethereum/assets/${getAddress(
              pool.rewarder.rewardToken
            )}/logo.png`

        const decimals = 10 ** pool.rewardToken.decimals

        const rewardPerBlock =
          pool.rewardToken.symbol === 'ALCX'
            ? pool.rewarder.rewardPerSecond / decimals
            : (pool.rewarder.rewardPerSecond / decimals) * averageBlockTime

        const rewardPerDay =
          pool.rewardToken.symbol === 'ALCX'
            ? (pool.rewarder.rewardPerSecond / decimals) * blocksPerDay
            : (pool.rewarder.rewardPerSecond / decimals) * averageBlockTime * blocksPerDay

        const reward = {
          token: pool.rewardToken.symbol,
          icon: icon,
          rewardPerBlock: rewardPerBlock,
          rewardPerDay: rewardPerDay,
          rewardPrice: pool.rewardToken.derivedETH * ethPrice,
        }

        rewards[1] = reward
      } else if (pool.breeder === Breeder.MINIBREEDER) {
        const kangaPerSecond =
          ((pool.allocPoint / pool.miniBreeder.totalAllocPoint) * pool.miniBreeder.kangaPerSecond) / 1e18
        const kangaPerBlock = kangaPerSecond * averageBlockTime
        const kangaPerDay = kangaPerBlock * blocksPerDay
        const rewardPerSecond =
          ((pool.allocPoint / pool.miniBreeder.totalAllocPoint) * pool.rewarder.rewardPerSecond) / 1e18
        const rewardPerBlock = rewardPerSecond * averageBlockTime
        const rewardPerDay = rewardPerBlock * blocksPerDay

        const reward = {
          [ChainId.MATIC]: {
            token: 'MATIC',
            icon: 'https://raw.githubusercontent.com/kangafinance/icons/master/token/polygon.jpg',
            rewardPrice: maticPrice,
            rewardPerBlock,
            rewardPerDay,
          },
          [ChainId.XDAI]: {
            token: 'STAKE',
            icon: 'https://raw.githubusercontent.com/kangafinance/icons/master/token/stake.jpg',
            rewardPerBlock,
            rewardPerDay,
            rewardPrice: stakePrice,
          },
          [ChainId.HARMONY]: {
            token: 'ONE',
            icon: 'https://raw.githubusercontent.com/kangafinance/icons/master/token/one.jpg',
            rewardPrice: onePrice,
          },
        }

        rewards[0] = {
          ...defaultReward,
          rewardPerBlock: kangaPerBlock,
          rewardPerDay: kangaPerDay,
        }

        if (chainId in reward) {
          rewards[1] = reward[chainId]
        }
      }

      return rewards
    }

    const rewards = getRewards()

    const balance = swapPair ? Number(pool.balance / 1e18) : pool.balance / 10 ** troopPair.token0.decimals

    const tvl = swapPair
      ? (balance / Number(swapPair.totalSupply)) * Number(swapPair.reserveUSD)
      : balance * troopPair.token0.derivedETH * ethPrice

    const feeApyPerYear = swapPair
      ? aprToApy((((((pair?.volumeUSD - pair1w?.volumeUSD) * 0.0025) / 7) * 365) / pair?.reserveUSD) * 100, 3650) / 100
      : 0

    const feeApyPerMonth = feeApyPerYear / 12
    const feeApyPerDay = feeApyPerMonth / 30
    const feeApyPerHour = feeApyPerDay / blocksPerHour

    const roiPerBlock =
      rewards.reduce((previousValue, currentValue) => {
        return previousValue + currentValue.rewardPerBlock * currentValue.rewardPrice
      }, 0) / tvl

    const rewardAprPerHour = roiPerBlock * blocksPerHour
    const rewardAprPerDay = rewardAprPerHour * 24
    const rewardAprPerMonth = rewardAprPerDay * 30
    const rewardAprPerYear = rewardAprPerMonth * 12

    const roiPerHour = rewardAprPerHour + feeApyPerHour
    const roiPerMonth = rewardAprPerMonth + feeApyPerMonth
    const roiPerDay = rewardAprPerDay + feeApyPerDay
    const roiPerYear = rewardAprPerYear + feeApyPerYear

    const position = positions.find((position) => position.id === pool.id && position.breeder === pool.breeder)

    return {
      ...pool,
      ...position,
      pair: {
        ...pair,
        decimals: pair.type === PairType.TROOP ? Number(pair.asset.tokenInfo.decimals) : 18,
        type,
      },
      balance,
      feeApyPerHour,
      feeApyPerDay,
      feeApyPerMonth,
      feeApyPerYear,
      rewardAprPerHour,
      rewardAprPerDay,
      rewardAprPerMonth,
      rewardAprPerYear,
      roiPerBlock,
      roiPerHour,
      roiPerDay,
      roiPerMonth,
      roiPerYear,
      rewards,
      tvl,
    }
  }

  return farms
    .filter((farm) => {
      return (
        (swapPairs && swapPairs.find((pair) => pair.id === farm.pair)) ||
        (troopPairs && troopPairs.find((pair) => pair.id === farm.pair))
      )
    })
    .map(map)
}
