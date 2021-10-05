import { AXKANGA, KANGA } from '../../../config/tokens'
import { ChainId, KANGA_ADDRESS } from '@kangafinance/sdk'
import { StrategyGeneralInfo, StrategyHook, StrategyTokenDefinitions } from '../types'
import { useEffect, useMemo } from 'react'

import { I18n } from '@lingui/core'
import { t } from '@lingui/macro'
import { useActiveWeb3React } from '../../../hooks'
import useBaseStrategy from './useBaseStrategy'
import { useLingui } from '@lingui/react'
import { useTokenBalances } from '../../wallet/hooks'

export const GENERAL = (i18n: I18n): StrategyGeneralInfo => ({
  name: i18n._(t`KANGA → Aave`),
  steps: [i18n._(t`KANGA`), i18n._(t`xKANGA`), i18n._(t`Aave`)],
  zapMethod: 'stakeKangaToAave',
  unzapMethod: 'unstakeKangaFromAave',
  description: i18n._(
    t`Stake KANGA for xKANGA and deposit into Aave in one click. xKANGA in Aave (aXKANGA) can be lent or used as collateral for borrowing.`
  ),
  inputSymbol: i18n._(t`KANGA`),
  outputSymbol: i18n._(t`xKANGA in Aave`),
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
    address: '0xF256CC7847E919FAc9B808cC216cAc87CCF2f47a',
    decimals: 18,
    symbol: 'aXKANGA',
  },
}

const useStakeKangaToAaveStrategy = (): StrategyHook => {
  const { i18n } = useLingui()
  const { account } = useActiveWeb3React()
  const balances = useTokenBalances(account, [KANGA[ChainId.MAINNET], AXKANGA])
  const general = useMemo(() => GENERAL(i18n), [i18n])
  const { setBalances, ...strategy } = useBaseStrategy({
    id: 'stakeKangaToAaveStrategy',
    general,
    tokenDefinitions,
  })

  useEffect(() => {
    if (!balances) return

    setBalances({
      inputTokenBalance: balances[KANGA[ChainId.MAINNET].address],
      outputTokenBalance: balances[AXKANGA.address],
    })
  }, [balances, setBalances])

  return useMemo(
    () => ({
      ...strategy,
      setBalances,
    }),
    [strategy, setBalances]
  )
}

export default useStakeKangaToAaveStrategy
