import { ChainId } from '@kangafinance/sdk'

export enum Feature {
  AMM = 'AMM',
  AMM_V2 = 'AMM V2',
  LIQUIDITY_MINING = 'Liquidity Mining',
  MOB = 'Mob',
  TROOP = 'Troop',
  JOEY = 'JOEY',
  ANALYTICS = 'Analytics',
  MIGRATE = 'Migrate',
  STAKING = 'Staking',
}

const features = {
  [ChainId.MAINNET]: [
    Feature.AMM,
    Feature.LIQUIDITY_MINING,
    Feature.MOB,
    Feature.TROOP,
    Feature.MIGRATE,
    Feature.ANALYTICS,
    Feature.STAKING,
    Feature.JOEY,
  ],
  [ChainId.ROPSTEN]: [Feature.AMM, Feature.LIQUIDITY_MINING, Feature.MOB, Feature.TROOP],
  [ChainId.RINKEBY]: [Feature.AMM, Feature.LIQUIDITY_MINING, Feature.MOB, Feature.TROOP],
  [ChainId.GÖRLI]: [Feature.AMM, Feature.LIQUIDITY_MINING, Feature.MOB, Feature.TROOP],
  [ChainId.KOVAN]: [Feature.AMM, Feature.LIQUIDITY_MINING, Feature.MOB, Feature.TROOP],
  [ChainId.BSC]: [Feature.AMM, Feature.MOB, Feature.TROOP, Feature.MIGRATE, Feature.ANALYTICS],
  [ChainId.BSC_TESTNET]: [Feature.AMM],
  [ChainId.FANTOM]: [Feature.AMM, Feature.ANALYTICS],
  [ChainId.FANTOM_TESTNET]: [Feature.AMM],
  [ChainId.MATIC]: [
    Feature.AMM,
    Feature.LIQUIDITY_MINING,
    Feature.MOB,
    Feature.TROOP,
    Feature.MIGRATE,
    Feature.ANALYTICS,
  ],
  [ChainId.MATIC_TESTNET]: [Feature.AMM],
  [ChainId.HARMONY]: [Feature.AMM, Feature.LIQUIDITY_MINING, Feature.ANALYTICS],
  [ChainId.HARMONY_TESTNET]: [Feature.AMM],
  [ChainId.AVALANCHE]: [Feature.AMM, Feature.MOB, Feature.TROOP],
  [ChainId.AVALANCHE_TESTNET]: [Feature.AMM],
  [ChainId.OKEX]: [Feature.AMM],
  [ChainId.OKEX_TESTNET]: [Feature.AMM],
  [ChainId.XDAI]: [Feature.AMM, Feature.LIQUIDITY_MINING, Feature.ANALYTICS, Feature.MOB, Feature.TROOP],
  [ChainId.MOONRIVER]: [Feature.AMM],
  [ChainId.ARBITRUM]: [Feature.AMM, Feature.LIQUIDITY_MINING, Feature.ANALYTICS, Feature.MOB, Feature.TROOP],
}

export function featureEnabled(feature: Feature, chainId: ChainId): boolean {
  return features?.[chainId]?.includes(feature)
}

export function chainsWithFeature(feature: Feature): ChainId[] {
  return Object.keys(features)
    .filter((chain) => features[chain].includes(feature))
    .map((chain) => ChainId[chain])
}
