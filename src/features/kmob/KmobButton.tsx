import { ApprovalState, useActiveWeb3React } from '../../hooks'
import { Field, KmobState } from '../../pages/tools/kmob'
import React, { FC, useMemo, useState } from 'react'
import { KANGA, XKANGA } from '../../config/tokens'
import TransactionConfirmationModal, { ConfirmationModalContent } from '../../modals/TransactionConfirmationModal'

import Button from '../../components/Button'
import { ChainId } from '@kangafinance/sdk'
import Dots from '../../components/Dots'
import { parseUnits } from '@ethersproject/units'
import { t } from '@lingui/macro'
import { tryParseAmount } from '../../functions'
import { useLingui } from '@lingui/react'
import useKmob from '../../hooks/useKmob'
import { useTokenBalance } from '../../state/wallet/hooks'

interface KmobButtonProps {
  kmobState: KmobState
}

const KmobButton: FC<KmobButtonProps> = ({ kmobState }) => {
  const { currencies, kmob: doKmob, fields } = kmobState
  const { i18n } = useLingui()
  const [modalState, setModalState] = useState({
    attemptingTxn: false,
    txHash: '',
    open: false,
  })
  const { account, chainId } = useActiveWeb3React()
  const kangaBalance = useTokenBalance(account, KANGA[ChainId.MAINNET])
  const xKangaBalance = useTokenBalance(account, XKANGA)
  const { approvalState, approve, kmob, unkmob, kmobKanga, unkmobKanga } = useKmob(
    currencies[Field.INPUT] === KANGA[ChainId.MAINNET]
  )
  const balance = useTokenBalance(account, currencies[Field.INPUT])
  const parsedInputAmount = tryParseAmount(fields[Field.INPUT], currencies[Field.INPUT])
  const parsedOutputAmount = tryParseAmount(fields[Field.OUTPUT], currencies[Field.OUTPUT])

  const closeModal = () => {
    setModalState((prevState) => ({
      ...prevState,
      open: false,
    }))
  }

  const handleSubmit = async () => {
    setModalState({
      attemptingTxn: true,
      open: true,
      txHash: '',
    })

    let tx
    if (doKmob) {
      if (currencies[Field.INPUT]?.symbol === 'KANGA') {
        tx = await kmobKanga({
          value: parseUnits(fields[Field.INPUT], kangaBalance.currency.decimals),
          decimals: kangaBalance.currency.decimals,
        })
      }
      if (currencies[Field.INPUT]?.symbol === 'xKANGA') {
        tx = await kmob({
          value: parseUnits(fields[Field.INPUT], kangaBalance.currency.decimals),
          decimals: xKangaBalance.currency.decimals,
        })
      }
    } else {
      if (currencies[Field.OUTPUT]?.symbol === 'KANGA') {
        tx = await unkmobKanga({
          value: parseUnits(fields[Field.INPUT], kangaBalance.currency.decimals),
          decimals: xKangaBalance.currency.decimals,
        })
      }
      if (currencies[Field.OUTPUT]?.symbol === 'xKANGA') {
        tx = await unkmob({
          value: parseUnits(fields[Field.INPUT], kangaBalance.currency.decimals),
          decimals: xKangaBalance.currency.decimals,
        })
      }
    }

    if (tx?.hash) {
      setModalState((prevState) => ({
        ...prevState,
        attemptingTxn: false,
        txHash: tx.hash,
      }))
    } else {
      closeModal()
    }
  }

  const buttonDisabledText = useMemo(() => {
    if (!balance) return i18n._(t`Loading Balance`)
    if (parsedInputAmount?.greaterThan(balance)) return i18n._(t`Insufficient Balance`)
    if (!parsedInputAmount?.greaterThan(0)) return i18n._(t`Please enter an amount`)
    return null
  }, [balance, i18n, parsedInputAmount])

  if (!account)
    return (
      <Button onClick={approve} color="gradient" disabled={true}>
        {i18n._(t`Connect to wallet`)}
      </Button>
    )

  if (chainId !== ChainId.MAINNET)
    return (
      <Button onClick={approve} color="gradient" disabled={true}>
        {i18n._(t`Network not supported yet`)}
      </Button>
    )

  if (approvalState === ApprovalState.PENDING)
    return (
      <Button color="gradient" disabled={true}>
        <Dots>{i18n._(t`Approving`)}</Dots>
      </Button>
    )

  if (approvalState === ApprovalState.NOT_APPROVED)
    return (
      <Button onClick={approve} color="gradient" disabled={!!buttonDisabledText}>
        {buttonDisabledText || i18n._(t`Approve`)}
      </Button>
    )

  if (approvalState === ApprovalState.APPROVED)
    return (
      <>
        <TransactionConfirmationModal
          isOpen={modalState.open}
          onDismiss={closeModal}
          attemptingTxn={modalState.attemptingTxn}
          hash={modalState.txHash}
          content={() => (
            <ConfirmationModalContent
              title={i18n._(t`Confirm convert`)}
              onDismiss={closeModal}
              topContent={() => <span />}
              bottomContent={() => <span />}
            />
          )}
          pendingText={i18n._(
            t`Converting ${parsedInputAmount?.toSignificant(6, { groupSeparator: ',' })} ${
              kmobState.currencies[Field.INPUT]?.symbol
            } for ${parsedOutputAmount?.toSignificant(6, { groupSeparator: ',' })} ${
              kmobState.currencies[Field.OUTPUT]?.symbol
            }`
          )}
        />
        <Button onClick={handleSubmit} disabled={!!buttonDisabledText} color="gradient">
          {buttonDisabledText || i18n._(t`Convert`)}
        </Button>
      </>
    )
}

export default KmobButton
