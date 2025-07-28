import { OptimizationHeader } from "../components/optimization/optimization-header"
import { OptimizationInsights } from "../components/optimization/optimization-insights"
import { OptimizationActions } from "../components/optimization/optimization-actions"

function Optimization() {
  return (
    <div className="space-y-6">
      <OptimizationHeader />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <OptimizationInsights />
        </div>
        <div>
          <OptimizationActions />
        </div>
      </div>
    </div>
  )
}

export default Optimization
