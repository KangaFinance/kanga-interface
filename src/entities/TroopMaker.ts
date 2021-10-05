import { BigNumber, BigNumberish } from '@ethersproject/bignumber'
import { ChainId, WNATIVE } from '@kangafinance/sdk'
import { getProviderOrSigner, getSigner } from '../functions/contract'

import { AddressZero } from '@ethersproject/constants'
import { Contract } from '@ethersproject/contracts'
import { Web3Provider } from '@ethersproject/providers'
import { ZERO} from '../functions/math'

import TROOPPAIR_ABI from '../constants/abis/trooppair.json'
import { TroopPermit } from '../hooks/useTroopApproveCallback'
import { defaultAbiCoder } from '@ethersproject/abi'
import { toElastic } from '../functions/rebase'
import { toShare } from '../functions/mob'

export async function signMasterContractApproval(
  mobContract: Contract | null,
  masterContract: string | undefined,
  user: string,
  library: Web3Provider,
  approved: boolean,
  chainId: ChainId | undefined
): Promise<string> {
  const warning = approved ? 'Give FULL access to funds in (and approved to) Mob?' : 'Revoke access to Mob?'
  const nonce = await mobContract?.nonces(user)
  const message = {
    warning,
    user,
    masterContract,
    approved,
    nonce,
  }

  const typedData = {
    types: {
      SetMasterContractApproval: [
        { name: 'warning', type: 'string' },
        { name: 'user', type: 'address' },
        { name: 'masterContract', type: 'address' },
        { name: 'approved', type: 'bool' },
        { name: 'nonce', type: 'uint256' },
      ],
    },
    primaryType: 'SetMasterContractApproval',
    domain: {
      name: 'Mob V1',
      chainId: chainId,
      verifyingContract: mobContract?.address,
    },
    message: message,
  }
  const signer = getSigner(library, user)
  return signer._signTypedData(typedData.domain, typedData.types, typedData.message)
}

enum Action {
  ADD_ASSET = 1,
  REPAY = 2,
  REMOVE_ASSET = 3,
  REMOVE_COLLATERAL = 4,
  BORROW = 5,
  GET_REPAY_SHARE = 6,
  GET_REPAY_PART = 7,
  ACCRUE = 8,

  // Functions that don't need accrue to be called
  ADD_COLLATERAL = 10,
  UPDATE_EXCHANGE_RATE = 11,

  // Function on Mob
  MOB_DEPOSIT = 20,
  MOB_WITHDRAW = 21,
  MOB_TRANSFER = 22,
  MOB_TRANSFER_MULTIPLE = 23,
  MOB_SETAPPROVAL = 24,

  // Any external call (except to Mob)
  CALL = 30,
}

export default class TroopMaker {
  private pair: any
  private account: string
  private library: Web3Provider | undefined
  private chainId: ChainId

  private actions: Action[]
  private values: BigNumber[]
  private datas: string[]

  constructor(
    pair: any,
    account: string | null | undefined,
    library: Web3Provider | undefined,
    chainId: ChainId | undefined
  ) {
    this.pair = pair
    this.account = account || AddressZero
    this.library = library
    this.chainId = chainId || 1

    this.actions = []
    this.values = []
    this.datas = []
  }

  add(action: Action, data: string, value: BigNumberish = 0): void {
    this.actions.push(action)
    this.datas.push(data)
    this.values.push(BigNumber.from(value))
  }

  approve(permit: TroopPermit): void {
    if (permit) {
      this.add(
        Action.MOB_SETAPPROVAL,
        defaultAbiCoder.encode(
          ['address', 'address', 'bool', 'uint8', 'bytes32', 'bytes32'],
          [permit.account, permit.masterContract, true, permit.v, permit.r, permit.s]
        )
      )
    }
  }

  updateExchangeRate(mustUpdate = false, minRate = ZERO, maxRate = ZERO): TroopMaker {
    this.add(
      Action.UPDATE_EXCHANGE_RATE,
      defaultAbiCoder.encode(['bool', 'uint256', 'uint256'], [mustUpdate, minRate, maxRate])
    )
    return this
  }

  mobDepositCollateral(amount: BigNumber): TroopMaker {
    const useNative = this.pair.collateral.address === WNATIVE[this.chainId].address

    this.add(
      Action.MOB_DEPOSIT,
      defaultAbiCoder.encode(
        ['address', 'address', 'int256', 'int256'],
        [useNative ? AddressZero : this.pair.collateral.address, this.account, amount, 0]
      ),
      useNative ? amount : ZERO
    )

    return this
  }

  mobWithdrawCollateral(amount: BigNumber, share: BigNumber): TroopMaker {
    const useNative = this.pair.collateral.address === WNATIVE[this.chainId].address

    this.add(
      Action.MOB_WITHDRAW,
      defaultAbiCoder.encode(
        ['address', 'address', 'int256', 'int256'],
        [useNative ? AddressZero : this.pair.collateral.address, this.account, amount, share]
      ),
      useNative ? amount : ZERO
    )

    return this
  }

  mobTransferCollateral(share: BigNumber, toAddress: string): TroopMaker {
    this.add(
      Action.MOB_TRANSFER,
      defaultAbiCoder.encode(['address', 'address', 'int256'], [this.pair.collateral.address, toAddress, share])
    )

    return this
  }

  repayShare(part: BigNumber): TroopMaker {
    this.add(Action.GET_REPAY_SHARE, defaultAbiCoder.encode(['int256'], [part]))

    return this
  }

  addCollateral(amount: BigNumber, fromMob: boolean): TroopMaker {
    let share: BigNumber
    if (fromMob) {
      share = amount.lt(0) ? amount : toShare(this.pair.collateral, amount)
    } else {
      const useNative = this.pair.collateral.address === WNATIVE[this.chainId].address

      this.add(
        Action.MOB_DEPOSIT,
        defaultAbiCoder.encode(
          ['address', 'address', 'int256', 'int256'],
          [useNative ? AddressZero : this.pair.collateral.address, this.account, amount, 0]
        ),
        useNative ? amount : ZERO
      )
      share = BigNumber.from(-2)
    }

    this.add(Action.ADD_COLLATERAL, defaultAbiCoder.encode(['int256', 'address', 'bool'], [share, this.account, false]))
    return this
  }

  addAsset(amount: BigNumber, fromMob: boolean): TroopMaker {
    let share: BigNumber
    if (fromMob) {
      share = toShare(this.pair.asset, amount)
    } else {
      const useNative = this.pair.asset.address === WNATIVE[this.chainId].address

      this.add(
        Action.MOB_DEPOSIT,
        defaultAbiCoder.encode(
          ['address', 'address', 'int256', 'int256'],
          [useNative ? AddressZero : this.pair.asset.address, this.account, amount, 0]
        ),
        useNative ? amount : ZERO
      )
      share = BigNumber.from(-2)
    }

    this.add(Action.ADD_ASSET, defaultAbiCoder.encode(['int256', 'address', 'bool'], [share, this.account, false]))
    return this
  }

  removeAsset(fraction: BigNumber, toMob: boolean): TroopMaker {
    this.add(Action.REMOVE_ASSET, defaultAbiCoder.encode(['int256', 'address'], [fraction, this.account]))
    if (!toMob) {
      const useNative = this.pair.asset.address === WNATIVE[this.chainId].address

      this.add(
        Action.MOB_WITHDRAW,
        defaultAbiCoder.encode(
          ['address', 'address', 'int256', 'int256'],
          [useNative ? AddressZero : this.pair.asset.address, this.account, 0, -1]
        )
      )
    }
    return this
  }

  removeCollateral(share: BigNumber, toMob: boolean): TroopMaker {
    this.add(
      Action.REMOVE_COLLATERAL,
      defaultAbiCoder.encode(['int256', 'address'], [share, this.account])
    )
    if (!toMob) {
      const useNative = this.pair.collateral.address === WNATIVE[this.chainId].address

      this.add(
        Action.MOB_WITHDRAW,
        defaultAbiCoder.encode(
          ['address', 'address', 'int256', 'int256'],
          [useNative ? AddressZero : this.pair.collateral.address, this.account, 0, share]
        )
      )
    }
    return this
  }

  removeCollateralFraction(fraction: BigNumber, toMob: boolean): TroopMaker {
    this.add(
      Action.REMOVE_COLLATERAL,
      defaultAbiCoder.encode(['int256', 'address'], [fraction, this.account])
    )
    if (!toMob) {
      const useNative = this.pair.collateral.address === WNATIVE[this.chainId].address

      this.add(
        Action.MOB_WITHDRAW,
        defaultAbiCoder.encode(
          ['address', 'address', 'int256', 'int256'],
          [useNative ? AddressZero : this.pair.collateral.address, this.account, 0, -1]
        )
      )
    }
    return this
  }

  borrow(amount: BigNumber, toMob: boolean, toAddress = ''): TroopMaker {
    this.add(
      Action.BORROW,
      defaultAbiCoder.encode(['int256', 'address'], [amount, toAddress && toMob ? toAddress : this.account])
    )
    if (!toMob) {
      const useNative = this.pair.asset.address === WNATIVE[this.chainId].address

      this.add(
        Action.MOB_WITHDRAW,
        defaultAbiCoder.encode(
          ['address', 'address', 'int256', 'int256'],
          [useNative ? AddressZero : this.pair.asset.address, toAddress || this.account, amount, 0]
        )
      )
    }
    return this
  }

  repay(amount: BigNumber, fromMob: boolean): TroopMaker {
    if (!fromMob) {
      const useNative = this.pair.asset.address === WNATIVE[this.chainId].address

      this.add(
        Action.MOB_DEPOSIT,
        defaultAbiCoder.encode(
          ['address', 'address', 'int256', 'int256'],
          [useNative ? AddressZero : this.pair.asset.address, this.account, amount, 0]
        ),
        useNative ? amount : ZERO
      )
    }
    this.add(Action.GET_REPAY_PART, defaultAbiCoder.encode(['int256'], [fromMob ? amount : -1]))
    this.add(Action.REPAY, defaultAbiCoder.encode(['int256', 'address', 'bool'], [-1, this.account, false]))
    return this
  }

  repayPart(part: BigNumber, fromMob: boolean): TroopMaker {
    if (!fromMob) {
      const useNative = this.pair.asset.address === WNATIVE[this.chainId].address

      this.add(Action.GET_REPAY_SHARE, defaultAbiCoder.encode(['int256'], [part]))
      this.add(
        Action.MOB_DEPOSIT,
        defaultAbiCoder.encode(
          ['address', 'address', 'int256', 'int256'],
          [useNative ? AddressZero : this.pair.asset.address, this.account, 0, -1]
        ),
        // TODO: Put some warning in the UI or not allow repaying ETH directly from wallet, because this can't be pre-calculated
        useNative ? toShare(this.pair.asset, toElastic(this.pair.totalBorrow, part, true)).mul(1001).div(1000) : ZERO
      )
    }
    this.add(Action.REPAY, defaultAbiCoder.encode(['int256', 'address', 'bool'], [part, this.account, false]))
    return this
  }

  action(
    address: string,
    value: BigNumberish,
    data: string,
    useValue1: boolean,
    useValue2: boolean,
    returnValues: number
  ): void {
    this.add(
      Action.CALL,
      defaultAbiCoder.encode(
        ['address', 'bytes', 'bool', 'bool', 'uint8'],
        [address, data, useValue1, useValue2, returnValues]
      ),
      value
    )
  }

  async make() {
    if (!this.library) {
      return {
        success: false,
      }
    }

    const troopPairCloneContract = new Contract(
      this.pair.address,
      TROOPPAIR_ABI,
      getProviderOrSigner(this.library, this.account) as any
    )

    try {
      return {
        success: true,
        tx: await troopPairCloneContract.make(this.actions, this.values, this.datas, {
          value: this.values.reduce((a, b) => a.add(b), ZERO),
        }),
      }
    } catch (error) {
      console.error('TroopMaker Error: ', error)
      return {
        success: false,
        error: error,
      }
    }
  }
}
