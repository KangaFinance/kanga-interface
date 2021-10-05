import { ChainId } from '@kangafinance/sdk'
const THE_GRAPH = 'https://api.thegraph.com'
const NAS_GRAPH = 'https://graph.kkt.one/node'
const HYPER_GRAPH = 'https://q.hg.network'
export const GRAPH_HOST = {
  [ChainId.MAINNET]: THE_GRAPH,
  [ChainId.XDAI]: THE_GRAPH,
  [ChainId.MATIC]: THE_GRAPH,
  [ChainId.FANTOM]: THE_GRAPH,
  [ChainId.BSC]: THE_GRAPH,
  [ChainId.AVALANCHE]: THE_GRAPH,
  [ChainId.CELO]: THE_GRAPH,
  [ChainId.ARBITRUM]: THE_GRAPH,
  [ChainId.HARMONY]: 'https://kanga.graph.t.hmny.io',
  [ChainId.OKEX]: HYPER_GRAPH,
  [ChainId.HECO]: HYPER_GRAPH,
}
