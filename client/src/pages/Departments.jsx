import { DepartmentList } from "../components/departments/department-list"
import { DepartmentHeader } from "../components/departments/department-header"

function Departments() {
  return (
    <div className="space-y-6">
      <DepartmentHeader />
      <DepartmentList />
    </div>
  )
}

export default Departments
