## TODO

- Have initial supply of Knaga
- Fix SLP not KLP

- Get abis for the following from troop-lending and jump (need to update harhat-config to create abis)
  - klp-oracle
  - multiswapper
  - limit-order
  - trooppair
  - univ2tokanga
  - zapper

```
johnlaptop kanga-interface (joey) $ cp ../kanga/abi/KangaToken.json src/constants/abis/kanga.json
johnlaptop kanga-interface (joey) $ cp ../kanga/abi/KangaBounce.json src/constants/abis/kangabounce.json
johnlaptop kanga-interface (joey) $ cp ../kanga/abi/MasterBreeder.json src/constants/abis/masterbreeder.json
johnlaptop kanga-interface (joey) $ cp ../kanga/abi/MasterBreederV2.json src/constants/abis/masterbreeder-v2.json
johnlaptop kanga-interface (joey) $ cp ../kanga/abi/MiniBreederV2.json src/constants/abis/minibreeder-v2.json
johnlaptop kanga-interface (joey) $ cp ../kanga/abi/UniswapV2Pair.json src/constants/abis/pair.json
johnlaptop kanga-interface (joey) $ cp ../kanga/abi/UniswapV2Router02.json src/constants/abis/router.json
```

- Configure cloudinary

* Check ICONS for tokens
* Update icons to have white background.
* Deploy new version to demo.kanga.finance
* Create multiple liquidity pools
* Begin Documentation with Contract addresses

- Get LimitOrder compiling
  - Limit Order tests passing
  - Include Limit Order Types in SDK
  - Review latest sushiswap limitorder button
- Review settlement functionality https://github.com/sushiswap/sushiswap-settlement
- Review ABI's
  - inari -> jump
  - meowshi -> kmob
- Clone Inari for ZAP functionality
- Implement kanga-vesting
- Review constants files (many have moved to config e.g. troop)
- Review features per chain - https://github.com/sushiswap/sushiswap-interface/blob/canary/src/functions/feature.ts
- Global Search and Replace (sushi, bento, kashi, onsen, cook, SLP, miso, meowshi, trident, bar, chef, inari)
- Review all ABI's and ensure that contracts are updated for Kanga
- Review chainlink oracles and ensure any kanga addresses are correct
- Review all Contracts => https://github.com/KangaFinance/kanga-interface/blob/joey/src/hooks/useContract.ts
  - Breeder -> Maker
  - KANGAMOB => MOB
  - KANGABOUNCE => BOUNCE
  - Billabong => Pub?
  - LimitOrder functionality has moved to KangaMob fix getSignatureWithProviderMob

## Document

- Token => Kanga (SUSHI)
- AMM => KangaFiance (SushiSwap)
- TokenHolder Reward Token => xKANGA (xSUSHI)
- Liquidity Provider Gauges => Boomer (Onsen)
- Lending => Troop (Kashi)
- Flash Loans => Mob (Bento)
- Yield Farming xKANGA -> KMOB (MEOW)
- ZAP Functionality => JUMP (Inari)
- First Release => Joey (Miso/Trident)
- Adoption => Bounce (SushiRoll)
- Tokenomics (Vesting)
- Aggregation
- Cross Chain Settlement
- Liquidity Strategies
- Asset Management
- Scheduling Functionality
- Bonding Curves
  - StableSwap
  - PriceOracleSwap
  - Liquidity Bootstrapping Pool
  - MulitToken Pools
  - Concentrated Liquidity
  - Adaptive Bonding Curve
- Staking Derivatives
- NFT Launchpad
  - NFT Derivatives
- DAO
