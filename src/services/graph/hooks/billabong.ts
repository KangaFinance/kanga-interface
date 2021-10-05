import { ChainId } from '@kangafinance/sdk'
import useSWR, { SWRConfiguration } from 'swr'
import { useActiveWeb3React } from '../../../hooks'
import { getBillabong, getBillabongHistory } from '../fetchers/billabong'
import { useBlock } from './blocks'

interface useBarProps {
  timestamp?: number
  block?: number
  shouldFetch?: boolean
}

export function useBillabong(
  { timestamp, block, shouldFetch = true }: useBarProps = {},
  swrConfig: SWRConfiguration = undefined
) {
  const blockFetched = useBlock({ timestamp, chainId: ChainId.MAINNET, shouldFetch: shouldFetch && !!timestamp })
  block = block ?? (timestamp ? blockFetched : undefined)

  const { data } = useSWR(shouldFetch ? ['billabong', block] : null, () => getBillabong(block), swrConfig)
  return data
}

interface useBarHistoryProps {
  shouldFetch?: boolean
}

export function useBillabongHistory(
  { shouldFetch = true }: useBarHistoryProps = {},
  swrConfig: SWRConfiguration = undefined
) {
  const { data } = useSWR(shouldFetch ? ['billabongHistory'] : null, () => getBillabongHistory(), swrConfig)
  return data
}
