import React, { useState } from 'react'
import { e10, minimum } from '../../functions/math'

import Button from '../../components/Button'
import { TroopApproveButton } from './Button'
import TroopMaker from '../../entities/TroopMaker'
import SmartNumberInput from './SmartNumberInput'
import { TransactionReview } from '../../entities/TransactionReview'
import TransactionReviewView from './TransactionReview'
import { Warnings } from '../../entities/Warnings'
import WarningsView from './WarningsList'
import { t } from '@lingui/macro'
import { useActiveWeb3React } from '../../hooks/useActiveWeb3React'
import { useTroopApprovalPending } from '../../state/application/hooks'
import useTroopApproveCallback from '../../hooks/useTroopApproveCallback'
import { useLingui } from '@lingui/react'

export default function LendWithdrawAction({ pair }: any): JSX.Element {
  const { account } = useActiveWeb3React()
  const pendingApprovalMessage = useTroopApprovalPending()

  const { i18n } = useLingui()

  // State
  const [useMob, setUseMob] = useState<boolean>(pair.asset.mobBalance.gt(0))
  const [value, setValue] = useState('')
  const [pinMax, setPinMax] = useState(false)

  const [troopApprovalState, approveTroopFallback, troopPermit, onApprove, onMake] = useTroopApproveCallback()

  // Calculated
  const max = minimum(pair.maxAssetAvailable, pair.currentUserAssetAmount.value)
  const displayValue = pinMax ? max.toFixed(pair.asset.tokenInfo.decimals) : value

  const fraction = pinMax
    ? minimum(pair.userAssetFraction, pair.maxAssetAvailableFraction)
    : value.toBigNumber(pair.asset.tokenInfo.decimals).mulDiv(pair.currentTotalAsset.base, pair.currentAllAssets.value)

  const warnings = new Warnings()
    .add(
      pair.currentUserAssetAmount.value.lt(value.toBigNumber(pair.asset.tokenInfo.decimals)),
      i18n._(
        t`Please make sure your ${useMob ? 'Mob' : 'wallet'} balance is sufficient to withdraw and then try again.`
      ),
      true
    )
    .add(
      pair.maxAssetAvailableFraction.lt(fraction),
      i18n._(
        t`The isn't enough liquidity available at the moment to withdraw this amount. Please try withdrawing less or later.`
      ),
      true
    )

  const transactionReview = new TransactionReview()
  if (displayValue && !warnings.broken) {
    const amount = displayValue.toBigNumber(pair.asset.tokenInfo.decimals)
    const newUserAssetAmount = pair.currentUserAssetAmount.value.sub(amount)
    transactionReview.addTokenAmount(
      i18n._(t`Balance`),
      pair.currentUserAssetAmount.value,
      newUserAssetAmount,
      pair.asset
    )
    transactionReview.addUSD(i18n._(t`Balance USD`), pair.currentUserAssetAmount.value, newUserAssetAmount, pair.asset)

    const newUtilization = e10(18).mulDiv(pair.currentBorrowAmount.value, pair.currentAllAssets.value.sub(amount))
    transactionReview.addPercentage(i18n._(t`Borrowed`), pair.utilization.value, newUtilization)
  }

  // Handlers
  async function onExecute(maker: TroopMaker) {
    const fraction = pinMax
      ? minimum(pair.userAssetFraction, pair.maxAssetAvailableFraction)
      : value
          .toBigNumber(pair.asset.tokenInfo.decimals)
          .mulDiv(pair.currentTotalAsset.base, pair.currentAllAssets.value)

    maker.removeAsset(fraction, useMob)
    return `${i18n._(t`Withdraw`)} ${pair.asset.tokenInfo.symbol}`
  }

  return (
    <>
      <div className="mt-6 text-3xl text-high-emphesis">
        {i18n._(t`Withdraw`)} {pair.asset.tokenInfo.symbol}
      </div>

      <SmartNumberInput
        color="blue"
        token={pair.asset}
        value={displayValue}
        setValue={setValue}
        useMobTitleDirection="up"
        useMobTitle="to"
        useMob={useMob}
        setUseMob={setUseMob}
        max={max}
        pinMax={pinMax}
        setPinMax={setPinMax}
        showMax={true}
      />

      <WarningsView warnings={warnings} />
      <TransactionReviewView transactionReview={transactionReview}></TransactionReviewView>

      <TroopApproveButton
        color="blue"
        content={(onMake: any) => (
          <Button
            onClick={() => onMake(pair, onExecute)}
            disabled={displayValue.toBigNumber(pair.asset.tokenInfo.decimals).lte(0) || warnings.broken}
          >
            {i18n._(t`Withdraw`)}
          </Button>
        )}
      />
    </>
  )
}
