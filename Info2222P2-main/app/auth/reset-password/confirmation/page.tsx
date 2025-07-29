"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Users, Mail } from "lucide-react"

export default function ResetPasswordConfirmationPage() {
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

        <main className="flex-1 container max-w-md py-6 md:py-12">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 mb-6">
              <Mail className="h-10 w-10 text-primary" />
            </div>

            <h1 className="text-3xl font-bold mb-2">Check your email</h1>
            <p className="text-muted-foreground mb-6">
              We've sent a password reset link to your email address. Click the link to create a new password.
            </p>

            <div className="w-full p-4 mb-6 bg-muted/50 rounded-lg">
              <p className="text-sm font-medium">
                The reset link will expire in 24 hours. If you don't see the email, check your spam folder.
              </p>
            </div>

            <Button asChild className="w-full">
              <Link href="/auth/login">
                Return to login
              </Link>
            </Button>
          </div>
        </main>
      </div>
    </div>
  )
}
