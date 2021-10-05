import {
  ARCHER_ROUTER_ADDRESS,
  BILLABONG_ADDRESS,
  KANGAMOB_ADDRESS,
  BORING_HELPER_ADDRESS,
  CHAINLINK_ORACLE_ADDRESS,
  ChainId,
  ENS_REGISTRAR_ADDRESS,
  FACTORY_ADDRESS,
  TROOP_ADDRESS,
  MAKER_ADDRESS,
  MASTERBREEDER_ADDRESS,
  MASTERBREEDER_V2_ADDRESS,
  MERKLE_DISTRIBUTOR_ADDRESS,
  MINIBREEDER_ADDRESS,
  MULTICALL2_ADDRESS,
  ROUTER_ADDRESS,
  STOP_LIMIT_ORDER_ADDRESS,
  KANGA_ADDRESS,
  TIMELOCK_ADDRESS,
  WNATIVE_ADDRESS,
} from '@kangafinance/sdk'
import {
  ARGENT_WALLET_DETECTOR_ABI,
  ARGENT_WALLET_DETECTOR_MAINNET_ADDRESS,
} from '../constants/abis/argent-wallet-detector'

import ARCHER_ROUTER_ABI from '../constants/abis/archer-router.json'
import BILLABONG_ABI from '../constants/abis/billabong.json'
import MOB_ABI from '../constants/abis/mob.json'
import BORING_HELPER_ABI from '../constants/abis/boring-helper.json'
import CHAINLINK_ORACLE_ABI from '../constants/abis/chainlink-oracle.json'
import CLONE_REWARDER_ABI from '../constants/abis/clone-rewarder.json'
import COMPLEX_REWARDER_ABI from '../constants/abis/complex-rewarder.json'
import { Contract } from '@ethersproject/contracts'
import EIP_2612_ABI from '../constants/abis/eip-2612.json'
import ENS_ABI from '../constants/abis/ens-registrar.json'
import ENS_PUBLIC_RESOLVER_ABI from '../constants/abis/ens-public-resolver.json'
import ERC20_ABI from '../constants/abis/erc20.json'
import { ERC20_BYTES32_ABI } from '../constants/abis/erc20'
import FACTORY_ABI from '../constants/abis/factory.json'
import JUMP_ABI from '../constants/abis/jump.json'
import IUniswapV2PairABI from '../constants/abis/uniswap-v2-pair.json'
import LIMIT_ORDER_ABI from '../constants/abis/limit-order.json'
import LIMIT_ORDER_HELPER_ABI from '../constants/abis/limit-order-helper.json'
import MAKER_ABI from '../constants/abis/maker.json'
import MASTERBREEDER_ABI from '../constants/abis/masterbreeder.json'
import MASTERBREEDER_V2_ABI from '../constants/abis/masterbreeder-v2.json'
import KMOB_ABI from '../constants/abis/kmob.json'
import MERKLE_DISTRIBUTOR_ABI from '../constants/abis/merkle-distributor.json'
import MINIBREEDER_ABI from '../constants/abis/minibreeder-v2.json'
import MULTICALL2_ABI from '../constants/abis/multicall2.json'
import ROUTER_ABI from '../constants/abis/router.json'
import KANGA_ABI from '../constants/abis/kanga.json'
import TIMELOCK_ABI from '../constants/abis/timelock.json'
import UNI_FACTORY_ABI from '../constants/abis/uniswap-v2-factory.json'
import WETH9_ABI from '../constants/abis/weth.json'
import ZENKO_ABI from '../constants/abis/zenko.json'
import { getContract } from '../functions/contract'
import { useActiveWeb3React } from './useActiveWeb3React'
import { useMemo } from 'react'

const UNI_FACTORY_ADDRESS = '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f'

export function useEIP2612Contract(tokenAddress?: string): Contract | null {
  return useContract(tokenAddress, EIP_2612_ABI, false)
}

// returns null on errors
export function useContract(address: string | undefined, ABI: any, withSignerIfPossible = true): Contract | null {
  const { library, account } = useActiveWeb3React()

  return useMemo(() => {
    if (!address || !ABI || !library) return null
    try {
      return getContract(address, ABI, library, withSignerIfPossible && account ? account : undefined)
    } catch (error) {
      console.error('Failed to get contract', error)
      return null
    }
  }, [address, ABI, library, withSignerIfPossible, account])
}

export function useTokenContract(tokenAddress?: string, withSignerIfPossible?: boolean): Contract | null {
  return useContract(tokenAddress, ERC20_ABI, withSignerIfPossible)
}

export function useWETH9Contract(withSignerIfPossible?: boolean): Contract | null {
  const { chainId } = useActiveWeb3React()
  return useContract(chainId && WNATIVE_ADDRESS[chainId], WETH9_ABI, withSignerIfPossible)
}

export function useArgentWalletDetectorContract(): Contract | null {
  const { chainId } = useActiveWeb3React()
  return useContract(
    chainId === ChainId.MAINNET ? ARGENT_WALLET_DETECTOR_MAINNET_ADDRESS : undefined,
    ARGENT_WALLET_DETECTOR_ABI,
    false
  )
}

export function useENSRegistrarContract(withSignerIfPossible?: boolean): Contract | null {
  const { chainId } = useActiveWeb3React()
  return useContract(chainId && ENS_REGISTRAR_ADDRESS[chainId], ENS_ABI, withSignerIfPossible)
}

export function useENSResolverContract(address: string | undefined, withSignerIfPossible?: boolean): Contract | null {
  return useContract(address, ENS_PUBLIC_RESOLVER_ABI, withSignerIfPossible)
}

export function useBytes32TokenContract(tokenAddress?: string, withSignerIfPossible?: boolean): Contract | null {
  return useContract(tokenAddress, ERC20_BYTES32_ABI, withSignerIfPossible)
}

export function usePairContract(pairAddress?: string, withSignerIfPossible?: boolean): Contract | null {
  return useContract(pairAddress, IUniswapV2PairABI, withSignerIfPossible)
}

export function useMerkleDistributorContract(): Contract | null {
  const { chainId } = useActiveWeb3React()
  return useContract(chainId ? MERKLE_DISTRIBUTOR_ADDRESS[chainId] : undefined, MERKLE_DISTRIBUTOR_ABI, true)
}

export function useBoringHelperContract(): Contract | null {
  const { chainId } = useActiveWeb3React()
  return useContract(chainId && BORING_HELPER_ADDRESS[chainId], BORING_HELPER_ABI, false)
}

export function useMulticall2Contract() {
  const { chainId } = useActiveWeb3React()
  return useContract(chainId && MULTICALL2_ADDRESS[chainId], MULTICALL2_ABI, false)
}

export function useKangaContract(withSignerIfPossible = true): Contract | null {
  const { chainId } = useActiveWeb3React()
  return useContract(chainId && KANGA_ADDRESS[chainId], KANGA_ABI, withSignerIfPossible)
}

export function useMasterBreederContract(withSignerIfPossible?: boolean): Contract | null {
  const { chainId } = useActiveWeb3React()
  return useContract(chainId && MASTERBREEDER_ADDRESS[chainId], MASTERBREEDER_ABI, withSignerIfPossible)
}

export function useMasterBreederV2Contract(withSignerIfPossible?: boolean): Contract | null {
  const { chainId } = useActiveWeb3React()
  return useContract(chainId && MASTERBREEDER_V2_ADDRESS[chainId], MASTERBREEDER_V2_ABI, withSignerIfPossible)
}
export function useMiniBreederContract(withSignerIfPossible?: boolean): Contract | null {
  const { chainId } = useActiveWeb3React()
  return useContract(chainId && MINIBREEDER_ADDRESS[chainId], MINIBREEDER_ABI, withSignerIfPossible)
}

export function useFactoryContract(): Contract | null {
  const { chainId } = useActiveWeb3React()
  console.log(`KangaFactoryAddress: ${JSON.stringify(FACTORY_ADDRESS[chainId])}`)
  return useContract(chainId && FACTORY_ADDRESS[chainId], FACTORY_ABI, false)
}

export function useRouterContract(useArcher = false, withSignerIfPossible?: boolean): Contract | null {
  const { chainId } = useActiveWeb3React()

  const address = useArcher ? ARCHER_ROUTER_ADDRESS[chainId] : ROUTER_ADDRESS[chainId]
  const abi = useArcher ? ARCHER_ROUTER_ABI : ROUTER_ABI
  console.log(`KangaRouterAddress: ${JSON.stringify(address)}`)

  return useContract(address, abi, withSignerIfPossible)
}

export function useBillabongContract(withSignerIfPossible?: boolean): Contract | null {
  const { chainId } = useActiveWeb3React()
  return useContract(chainId && BILLABONG_ADDRESS[chainId], BILLABONG_ABI, withSignerIfPossible)
}

export function useMakerContract(): Contract | null {
  const { chainId } = useActiveWeb3React()
  return useContract(chainId && MAKER_ADDRESS[chainId], MAKER_ABI, false)
}

export function useTimelockContract(): Contract | null {
  const { chainId } = useActiveWeb3React()
  return useContract(chainId && TIMELOCK_ADDRESS[chainId], TIMELOCK_ABI, false)
}

export function useMobContract(withSignerIfPossible?: boolean): Contract | null {
  const { chainId } = useActiveWeb3React()
  return useContract(chainId && KANGAMOB_ADDRESS[chainId], MOB_ABI, withSignerIfPossible)
}

export function useChainlinkOracle(): Contract | null {
  const { chainId } = useActiveWeb3React()
  return useContract(chainId && CHAINLINK_ORACLE_ADDRESS[chainId], CHAINLINK_ORACLE_ABI, false)
}

export function useUniV2FactoryContract(): Contract | null {
  return useContract(UNI_FACTORY_ADDRESS, UNI_FACTORY_ABI, false)
}

export function useComplexRewarderContract(address, withSignerIfPossible?: boolean): Contract | null {
  return useContract(address, COMPLEX_REWARDER_ABI, withSignerIfPossible)
}

export function useCloneRewarderContract(address, withSignerIfPossibe?: boolean): Contract | null {
  return useContract(address, CLONE_REWARDER_ABI, withSignerIfPossibe)
}

export function useKmobContract(withSignerIfPossible?: boolean): Contract | null {
  return useContract('0x650F44eD6F1FE0E1417cb4b3115d52494B4D9b6D', KMOB_ABI, withSignerIfPossible)
}

export function useLimitOrderContract(withSignerIfPossibe?: boolean): Contract | null {
  const { chainId } = useActiveWeb3React()
  return useContract(STOP_LIMIT_ORDER_ADDRESS[chainId], LIMIT_ORDER_ABI, withSignerIfPossibe)
}

export function useLimitOrderHelperContract(withSignerIfPossible?: boolean): Contract | null {
  return useContract('0xe2f736B7d1f6071124CBb5FC23E93d141CD24E12', LIMIT_ORDER_HELPER_ABI, withSignerIfPossible)
}

export function useJumpContract(withSignerIfPossible?: boolean): Contract | null {
  return useContract('0x195E8262AA81Ba560478EC6Ca4dA73745547073f', JUMP_ABI, withSignerIfPossible)
}

export function useZenkoContract(withSignerIfPossible?: boolean): Contract | null {
  return useContract('0xa8f676c49f91655ab3b7c3ea2b73bb3088b2bc1f', ZENKO_ABI, withSignerIfPossible)
}
