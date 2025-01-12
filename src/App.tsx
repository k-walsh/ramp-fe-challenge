import { Fragment, useCallback, useEffect, useMemo, useState } from "react"
import { InputSelect } from "./components/InputSelect"
import { Instructions } from "./components/Instructions"
import { Transactions } from "./components/Transactions"
import { useEmployees } from "./hooks/useEmployees"
import { usePaginatedTransactions } from "./hooks/usePaginatedTransactions"
import { useTransactionsByEmployee } from "./hooks/useTransactionsByEmployee"
import { EMPTY_EMPLOYEE } from "./utils/constants"
import { Employee } from "./utils/types"

export function App() {
  const { data: employees, ...employeeUtils } = useEmployees()
  const { data: paginatedTransactions, ...paginatedTransactionsUtils } = usePaginatedTransactions()
  const { data: transactionsByEmployee, ...transactionsByEmployeeUtils } = useTransactionsByEmployee()
  const [isLoading, setIsLoading] = useState(false)

  const transactions = useMemo(
    () => paginatedTransactions?.data ?? transactionsByEmployee?.data ?? null,
    [paginatedTransactions, transactionsByEmployee]
  )

  const nextPage = useMemo(
    () => paginatedTransactions?.nextPage ?? transactionsByEmployee?.nextPage ?? null,
    [paginatedTransactions, transactionsByEmployee]
  )

  // fix bug 6 but now there's an issue if u send a request to see more and then switch the employee before that request finishes
  const loadAllTransactions = useCallback(
    async (loadMore?: Boolean) => {
      if (loadMore) {
        // transactionsByEmployeeUtils.invalidateData() // not needed to clear employee cache
        await paginatedTransactionsUtils.fetchAll()
      } else {
        setIsLoading(true)
        await employeeUtils.fetchAll()
        setIsLoading(false)

        await paginatedTransactionsUtils.fetchAll()
      }
    },
    [employeeUtils, paginatedTransactionsUtils]
  )

  const loadTransactionsByEmployee = useCallback(
    async (employeeId: string) => {
      paginatedTransactionsUtils.invalidateData()

      if (employeeId === "all") {
        await paginatedTransactionsUtils.fetchAll()
      } else {
        await transactionsByEmployeeUtils.fetchById(employeeId)
      }
    },
    [paginatedTransactionsUtils, transactionsByEmployeeUtils]
  )

  useEffect(() => {
    if (employees === null && !employeeUtils.loading) {
      loadAllTransactions()
    }
  }, [employeeUtils.loading, employees, loadAllTransactions])

  return (
    <Fragment>
      <main className="MainContainer">
        <Instructions />

        <hr className="RampBreak--l" />

        <InputSelect<Employee>
          isLoading={isLoading}
          defaultValue={EMPTY_EMPLOYEE}
          items={employees === null ? [] : [EMPTY_EMPLOYEE, ...employees]}
          label="Filter by employee"
          loadingLabel="Loading employees"
          parseItem={(item) => ({
            value: item.id,
            label: `${item.firstName} ${item.lastName}`,
          })}
          onChange={async (newValue) => {
            if (newValue === null) {
              return
            }

            await loadTransactionsByEmployee(newValue.id)
          }}
        />

        <div className="RampBreak--l" />

        <div className="RampGrid">
          <Transactions transactions={transactions} />

          {transactions !== null && nextPage !== null && (
            <button
              className="RampButton"
              disabled={paginatedTransactionsUtils.loading}
              onClick={async () => {
                await loadAllTransactions(true)
              }}
            >
              View More
            </button>
          )}
        </div>
      </main>
    </Fragment>
  )
}
