import { requireAuth } from '@/lib/auth'
import { TrainingPlanBuilder } from '@/components/training-plan-builder'

export default async function TrainingPlanPage() {
  const user = await requireAuth()

  return <TrainingPlanBuilder userId={user.id} />
}
