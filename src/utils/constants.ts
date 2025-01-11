import { Employee } from "./types"

export const EMPTY_EMPLOYEE: Employee = {
  id: "all", // changed id from "" to recognize the "all" case for bug 3
  firstName: "All",
  lastName: "Employees",
}
