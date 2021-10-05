import { useEffect, useMemo } from 'react'
import useSWR, { SWRConfiguration } from 'swr'

import { ChainId } from '@kangafinance/sdk'
import { getTroopPairs, getUserTroopPairs, getMobUserTokens } from '../fetchers/mob'
import { useActiveWeb3React } from '../../../hooks'
import { useBlock } from './blocks'
import { Feature, featureEnabled } from '../../../functions/feature'

interface useTroopPairsProps {
  timestamp?: number
  block?: number
  chainId: number
  shouldFetch?: boolean
  user?: string
  subset?: string[]
}

export function useTroopPairs(
  { timestamp, block, chainId, shouldFetch = true, user, subset }: useTroopPairsProps,
  swrConfig: SWRConfiguration = undefined
) {
  const blockFetched = useBlock({ timestamp, chainId, shouldFetch: shouldFetch && !!timestamp })
  block = block ?? (timestamp ? blockFetched : undefined)

  shouldFetch = shouldFetch ? featureEnabled(Feature['TROOP'], chainId) : false

  const variables = {
    block: block ? { number: block } : undefined,
    where: {
      user: user?.toLowerCase(),
      id_in: subset?.map((id) => id.toLowerCase()),
    },
  }

  const { data } = useSWR(
    shouldFetch ? () => ['troopPairs', chainId, JSON.stringify(variables)] : null,
    (_, chainId) => getTroopPairs(chainId, variables),
    swrConfig
  )

  return data
}

export function useUserTroopPairs(variables = undefined, chainId = undefined, swrConfig: SWRConfiguration = undefined) {
  const { chainId: chainIdSelected, account } = useActiveWeb3React()
  chainId = chainId ?? chainIdSelected

  const shouldFetch = chainId && account

  variables =
    Object.keys(variables ?? {}).includes('user') && account
      ? variables
      : account
      ? { ...variables, user: account.toLowerCase() }
      : ''

  const { data } = useSWR(
    shouldFetch ? ['userTroopPairs', chainId, JSON.stringify(variables)] : null,
    () => getUserTroopPairs(chainId, variables),
    swrConfig
  )

  return data
}

export function useMobUserTokens(variables = undefined, chainId = undefined, swrConfig: SWRConfiguration = undefined) {
  const { chainId: chainIdSelected, account } = useActiveWeb3React()
  chainId = chainId ?? chainIdSelected

  const shouldFetch = chainId && account

  variables = Object.keys(variables ?? {}).includes('user')
    ? variables
    : account
    ? { ...variables, user: account.toLowerCase() }
    : ''

  const { data } = useSWR(
    shouldFetch ? ['mobUserTokens', chainId, JSON.stringify(variables)] : null,
    () => getMobUserTokens(chainId, variables),
    swrConfig
  )

  return data
}
