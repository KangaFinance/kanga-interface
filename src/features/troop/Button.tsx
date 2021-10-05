import { ApprovalState, useApproveCallback } from '../../hooks/useApproveCallback'
import { KANGAMOB_ADDRESS, WNATIVE_ADDRESS } from '@kangafinance/sdk'
import useTroopApproveCallback, { MobApprovalState } from '../../hooks/useTroopApproveCallback'

import Alert from '../../components/Alert'
import Button from '../../components/Button'
import Dots from '../../components/Dots'
import React from 'react'
import { t } from '@lingui/macro'
import { tryParseAmount } from '../../functions/parse'
import { useActiveWeb3React } from '../../hooks/useActiveWeb3React'
import { useLingui } from '@lingui/react'

export function TroopApproveButton({ content, color }: any): any {
  const { i18n } = useLingui()
  const [troopApprovalState, approveTroopFallback, troopPermit, onApprove, onMake] = useTroopApproveCallback()
  const showApprove =
    (troopApprovalState === MobApprovalState.NOT_APPROVED || troopApprovalState === MobApprovalState.PENDING) &&
    !troopPermit
  const showChildren = troopApprovalState === MobApprovalState.APPROVED || troopPermit

  return (
    <>
      {approveTroopFallback && (
        <Alert
          message={i18n._(
            t`Something went wrong during signing of the approval. This is expected for hardware wallets, such as Trezor and Ledger. Click again and the fallback method will be used`
          )}
          className="mb-4"
        />
      )}

      {showApprove && (
        <Button color={color} onClick={onApprove} className="mb-4">
          {i18n._(t`Approve Troop`)}
        </Button>
      )}

      {showChildren && React.cloneElement(content(onMake), { color })}
    </>
  )
}

export function TokenApproveButton({ children, value, token, needed, color }: any): any {
  const { i18n } = useLingui()
  const { chainId } = useActiveWeb3React()
  const [approvalState, approve] = useApproveCallback(
    tryParseAmount(value, token),
    chainId && KANGAMOB_ADDRESS[chainId]
  )

  const showApprove =
    chainId &&
    token &&
    token.address !== WNATIVE_ADDRESS[chainId] &&
    needed &&
    value &&
    (approvalState === ApprovalState.NOT_APPROVED || approvalState === ApprovalState.PENDING)

  return showApprove ? (
    <Button color={color} onClick={approve} className="mb-4">
      <Dots>
        {i18n._(t`Approve`)} {token.symbol}
      </Dots>
    </Button>
  ) : (
    React.cloneElement(children, { color })
  )
}
