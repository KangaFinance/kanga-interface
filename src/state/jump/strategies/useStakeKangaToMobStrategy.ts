import { ChainId, KANGA_ADDRESS } from '@kangafinance/sdk'
import { KANGA, XKANGA } from '../../../config/tokens'
import { StrategyGeneralInfo, StrategyHook, StrategyTokenDefinitions } from '../types'
import { useEffect, useMemo } from 'react'

import { I18n } from '@lingui/core'
import { t } from '@lingui/macro'
import { tryParseAmount } from '../../../functions'
import { useActiveWeb3React } from '../../../hooks'
import useBaseStrategy from './useBaseStrategy'
import { useMobBalance } from '../../mob/hooks'
import useMobTrait from '../traits/useMobTrait'
import { useLingui } from '@lingui/react'
import { useTokenBalances } from '../../wallet/hooks'

export const GENERAL = (i18n: I18n): StrategyGeneralInfo => ({
  name: i18n._(t`KANGA → Mob`),
  steps: [i18n._(t`KANGA`), i18n._(t`xKANGA`), i18n._(t`Mob`)],
  zapMethod: 'stakeKangaToMob',
  unzapMethod: 'unstakeKangaFromMob',
  description: i18n._(t`Stake KANGA for xKANGA and deposit into Mob in one click. xKANGA in Mob is automatically
                invested into a passive yield strategy, and can be lent or used as collateral for borrowing in Troop.`),
  inputSymbol: i18n._(t`KANGA`),
  outputSymbol: i18n._(t`xKANGA in Mob`),
})

export const tokenDefinitions: StrategyTokenDefinitions = {
  inputToken: {
    chainId: ChainId.MAINNET,
    address: KANGA_ADDRESS[ChainId.MAINNET],
    decimals: 18,
    symbol: 'KANGA',
  },
  outputToken: {
    chainId: ChainId.MAINNET,
    address: '0x8798249c2E607446EfB7Ad49eC89dD1865Ff4272',
    decimals: 18,
    symbol: 'XKANGA',
  },
}

const useStakeKangaToMobStrategy = (): StrategyHook => {
  const { i18n } = useLingui()
  const { account } = useActiveWeb3React()
  const balances = useTokenBalances(account, [KANGA[ChainId.MAINNET], XKANGA])
  const xKangaMobBalance = useMobBalance(XKANGA.address)

  // Strategy ends in Mob so use BaseMob strategy
  const general = useMemo(() => GENERAL(i18n), [i18n])
  const baseStrategy = useBaseStrategy({
    id: 'stakeKangaToMobStrategy',
    general,
    tokenDefinitions,
  })

  // Add in Mob trait as output is in Mob
  const { setBalances, ...strategy } = useMobTrait(baseStrategy)

  useEffect(() => {
    if (!balances) return

    setBalances({
      inputTokenBalance: balances[KANGA[ChainId.MAINNET].address],
      outputTokenBalance: tryParseAmount(xKangaMobBalance?.value?.toFixed(18) || '0', XKANGA),
    })
  }, [balances, setBalances, xKangaMobBalance?.value])

  return useMemo(
    () => ({
      setBalances,
      ...strategy,
    }),
    [strategy, setBalances]
  )
}

export default useStakeKangaToMobStrategy
