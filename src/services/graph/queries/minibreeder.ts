import gql from 'graphql-tag'

export const miniBreederPoolsQuery = gql`
  query miniBreederPoolsQuery(
    $first: Int! = 1000
    $skip: Int! = 0
    $orderBy: String! = "id"
    $orderDirection: String! = "desc"
    $where: Pool_filter! = { allocPoint_gt: 0 }
  ) {
    pools(first: $first, skip: $skip, orderBy: $orderBy, orderDirection: $orderDirection, where: $where) {
      id
      pair
      rewarder {
        id
        rewardToken
        rewardPerSecond
      }
      allocPoint
      lastRewardTime
      accKangaPerShare
      klpBalance
      userCount
      miniBreeder {
        id
        kangaPerSecond
        totalAllocPoint
      }
    }
  }
`

export const miniBreederPairAddressesQuery = gql`
  query miniBreederPairAddresses(
    $first: Int! = 1000
    $skip: Int! = 0
    $orderBy: String! = "id"
    $orderDirection: String! = "desc"
    $where: Pool_filter! = { allocPoint_gt: 0 }
  ) {
    pools(first: $first, skip: $skip, orderBy: $orderBy, orderDirection: $orderDirection, where: $where) {
      id
      allocPoint
      accKangaPerShare
      pair {
        id
      }
    }
  }
`
