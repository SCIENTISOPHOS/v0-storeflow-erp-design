"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { AlertTriangle } from "lucide-react"

export default function UnauthorizedPage() {
  const router = useRouter()

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push("/dashboard")
    }, 3000)
    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="text-center max-w-md">
        <div className="flex items-center justify-center gap-3 mb-4">
          <AlertTriangle className="h-8 w-8 text-foreground" strokeWidth={2} />
          <h1 className="text-3xl font-bold text-foreground">Unauthorized</h1>
        </div>
        <p className="text-muted-foreground leading-relaxed">
          {"You don't have access to this resource. Redirecting you shortly..."}
        </p>
      </div>
    </div>
  )
}
