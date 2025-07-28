import { DependencyGraph } from "../components/dependencies/dependency-graph"
import { DependencyControls } from "../components/dependencies/dependency-controls"

function Dependencies() {
  return (
    <div className="min-h-screen flex flex-col space-y-4 overflow-y-auto px-4 md:px-6 py-4 md:py-6">
      <div className="space-y-2">
        <h1 className="text-2xl md:text-3xl font-bold">Task Dependencies</h1>
        <p className="text-muted-foreground text-sm md:text-base">
          Visualize and manage task dependencies across departments
        </p>
      </div>

      <DependencyControls />

      <div className="border rounded-lg p-2 md:p-4 flex-1 bg-background overflow-hidden">
        <DependencyGraph />
      </div>
    </div>
  )
}

export default Dependencies
