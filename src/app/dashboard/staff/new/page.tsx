"use client"

import RouteGuard from "@/components/route-guard"
import StaffForm from "@/components/staff-form"

export default function NewStaffPage() {
  return (
    <RouteGuard permission="staff">
      <StaffForm mode="create" />
    </RouteGuard>
  )
}
