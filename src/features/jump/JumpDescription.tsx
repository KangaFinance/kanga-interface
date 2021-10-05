import React, { FC } from 'react'
import Typography from '../../components/Typography'
import { useDerivedJumpState } from '../../state/jump/hooks'

interface JumpHeaderProps {}

const JumpDescription: FC<JumpHeaderProps> = () => {
  const { general } = useDerivedJumpState()

  return (
    <div className="grid gap-2">
      <Typography variant="lg" className="text-high-emphesis" weight={700}>
        {general?.name}
      </Typography>
      <Typography>{general?.description}</Typography>
    </div>
  )
}

export default JumpDescription
