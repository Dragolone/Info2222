"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Users, KeyRound, Loader2 } from "lucide-react"
import { universities } from "@/lib/data/universities"

export default function ResetPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [studentId, setStudentId] = useState("")
  const [university, setUniversity] = useState("")
  const [isUsingStudentId, setIsUsingStudentId] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (isUsingStudentId) {
      if (!studentId) newErrors.studentId = "Please enter your UniKey/Student ID"
      if (!university) newErrors.university = "Please select your university"
    } else {
      if (!email) {
        newErrors.email = "Please enter your email"
      } else if (!/\S+@\S+\.\S+/.test(email)) {
        newErrors.email = "Please enter a valid email address"
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (validateForm()) {
      setIsLoading(true)

      // Simulate password reset request
      setTimeout(() => {
        setIsLoading(false)
        router.push("/auth/reset-password/confirmation")
      }, 1500)
    }
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

        <main className="flex-1 container max-w-md py-6 md:py-12">
          <div className="space-y-6">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 mb-4">
                <KeyRound className="h-10 w-10 text-primary" />
              </div>

              <h1 className="text-3xl font-bold">Reset your password</h1>
              <p className="text-muted-foreground mt-2 mb-6">
                Enter your email or student ID to reset your password
              </p>
            </div>

            <div className="bg-background rounded-lg border p-6 shadow-sm">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <button
                    type="button"
                    className={`px-4 py-2 text-sm rounded-md transition-colors ${!isUsingStudentId ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                    onClick={() => setIsUsingStudentId(false)}
                  >
                    Email
                  </button>
                  <button
                    type="button"
                    className={`px-4 py-2 text-sm rounded-md transition-colors ${isUsingStudentId ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                    onClick={() => setIsUsingStudentId(true)}
                  >
                    Student ID
                  </button>
                </div>

                {isUsingStudentId ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="university">University</Label>
                      <Select value={university} onValueChange={setUniversity}>
                        <SelectTrigger id="university" className={errors.university ? "border-destructive" : ""}>
                          <SelectValue placeholder="Select your university" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectLabel>Universities</SelectLabel>
                            {universities.map((uni) => (
                              <SelectItem key={uni.id} value={uni.id}>{uni.name}</SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                      {errors.university && <p className="text-sm text-destructive">{errors.university}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="studentId">UniKey/Student ID</Label>
                      <Input
                        id="studentId"
                        value={studentId}
                        onChange={(e) => setStudentId(e.target.value)}
                        className={errors.studentId ? "border-destructive" : ""}
                      />
                      {errors.studentId && <p className="text-sm text-destructive">{errors.studentId}</p>}
                    </div>
                  </>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={errors.email ? "border-destructive" : ""}
                    />
                    {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                  </div>
                )}

                <Button type="submit" className="w-full mt-6" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Reset Password"
                  )}
                </Button>
              </form>
            </div>

            <div className="text-center">
              <Link href="/auth/login" className="text-primary hover:underline">
                Back to login
              </Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
