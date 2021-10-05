import gql from 'graphql-tag'

export const mobTokenFieldsQuery = gql`
  fragment mobTokenFields on Token {
    id
    # mob
    name
    symbol
    decimals
    totalSupplyElastic
    totalSupplyBase
    block
    timestamp
  }
`

export const mobUserTokensQuery = gql`
  query mobUserTokens($user: String!, $skip: Int = 0, $first: Int = 1000, $block: Block_height) {
    userTokens(skip: $skip, first: $first, block: $block, where: { share_gt: 0, user: $user }) {
      token {
        ...mobTokenFields
      }
      share
    }
  }
  ${mobTokenFieldsQuery}
`

export const troopPairFieldsQuery = gql`
  fragment troopPairFields on TroopPair {
    id
    # mob
    type
    masterContract
    owner
    feeTo
    name
    symbol
    oracle
    asset {
      ...mobTokenFields
    }
    collateral {
      ...mobTokenFields
    }
    exchangeRate
    totalAssetElastic
    totalAssetBase
    totalCollateralShare
    totalBorrowElastic
    totalBorrowBase
    interestPerSecond
    utilization
    feesEarnedFraction
    totalFeesEarnedFraction
    lastAccrued
    supplyAPR
    borrowAPR
    # transactions
    # users
    block
    timestamp
  }
  ${mobTokenFieldsQuery}
`

export const troopPairsQuery = gql`
  query troopPairs(
    $skip: Int = 0
    $first: Int = 1000
    $where: TroopPair_filter
    $block: Block_height
    $orderBy: TroopPair_orderBy = "utilization"
    $orderDirection: OrderDirection! = "desc"
  ) {
    troopPairs(
      skip: $skip
      first: $first
      where: $where
      block: $block
      orderBy: $orderBy
      orderDirection: $orderDirection
    ) {
      ...troopPairFields
    }
  }
  ${troopPairFieldsQuery}
`

export const troopUserPairsQuery = gql`
  query troopUserPairs($user: String!, $skip: Int = 0, $first: Int = 1000, $block: Block_height) {
    userTroopPairs(skip: $skip, first: $first, block: $block, where: { user: $user }) {
      assetFraction
      collateralShare
      borrowPart
      pair {
        ...troopPairFields
      }
    }
  }
  ${troopPairFieldsQuery}
`
