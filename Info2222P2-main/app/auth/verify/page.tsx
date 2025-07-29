"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Users, Mail, CheckCircle, Loader2 } from "lucide-react"

export default function VerifyPage() {
  const router = useRouter()
  const [isResending, setIsResending] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)

  const handleResendEmail = () => {
    setIsResending(true)

    // Simulate email resend
    setTimeout(() => {
      setIsResending(false)
      setResendSuccess(true)

      // Reset success message after 5 seconds
      setTimeout(() => {
        setResendSuccess(false)
      }, 5000)
    }, 1500)
  }

  const handleVerifyForDemo = () => {
    router.push("/dashboard")
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-10 border-b bg-background">
          <div className="container flex h-16 items-center justify-between py-4">
            <div className="flex items-center gap-2">
              <Users className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">TeamSync</span>
            </div>
            <Link href="/auth/login" className="text-sm font-medium text-muted-foreground hover:text-primary">
              Back to login
            </Link>
          </div>
        </header>

        <main className="flex-1 container max-w-screen-md py-6 md:py-12">
          <div className="flex flex-col items-center justify-center text-center max-w-md mx-auto">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 mb-6">
              <Mail className="h-10 w-10 text-primary" />
            </div>

            <h1 className="text-3xl font-bold mb-2">Verify your email</h1>
            <p className="text-muted-foreground mb-6">
              We've sent a verification email to your inbox. Click the link in the email to verify your account.
            </p>

            <div className="w-full p-4 bg-muted/50 rounded-lg mb-6">
              <p className="text-sm font-medium">
                Didn't receive an email? Check your spam folder or request a new verification link.
              </p>
            </div>

            <div className="flex flex-col gap-4 w-full">
              <Button
                variant="outline"
                className="w-full"
                onClick={handleResendEmail}
                disabled={isResending || resendSuccess}
              >
                {isResending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : resendSuccess ? (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4 text-primary" />
                    Email sent!
                  </>
                ) : (
                  "Resend verification email"
                )}
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    For demo purpose
                  </span>
                </div>
              </div>

              <Button onClick={handleVerifyForDemo}>
                Skip verification & proceed to dashboard
              </Button>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
