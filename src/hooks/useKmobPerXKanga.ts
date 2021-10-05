import { useMobContract } from './useContract'
import { useEffect, useState } from 'react'
import { XKANGA } from '../config/tokens'
import { BigNumber } from '@ethersproject/bignumber'


export default function useKmobPerXKanga() {
  const mobContract = useMobContract()
  const [state, setState] = useState<[BigNumber, BigNumber]>([BigNumber.from('0'), BigNumber.from('0')])

  useEffect(() => {
    if (!mobContract) return
    ;(async () => {
      const toShare = await mobContract.toShare(XKANGA.address, '1'.toBigNumber(XKANGA.decimals), false)
      const toAmount = await mobContract.toAmount(XKANGA.address, '1'.toBigNumber(XKANGA.decimals), false)
      setState([toShare, toAmount])
    })()
  }, [mobContract])

  return state
}
