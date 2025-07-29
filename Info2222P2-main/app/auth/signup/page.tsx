"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { ChevronLeft, ChevronRight, Users, Upload, Loader2 } from "lucide-react"
import { universities } from "@/lib/data/universities"

interface FormData {
  userType: "student" | "faculty";
  university: string;
  isUniversityListed: boolean;
  universityName: string;
  studentId: string;
  email: string;
  joinMessage: string;
  password: string;
  confirmPassword: string;
  fullName: string;
  department: string;
  yearOfStudy: string;
  termsAgreed: boolean;
  privacyAgreed: boolean;
  communicationOptIn: boolean;
}

export default function SignupPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [formData, setFormData] = useState<FormData>({
    userType: "student",
    university: "",
    isUniversityListed: true,
    universityName: "",
    studentId: "",
    email: "",
    joinMessage: "",
    password: "",
    confirmPassword: "",
    fullName: "",
    department: "",
    yearOfStudy: "1",
    termsAgreed: false,
    privacyAgreed: false,
    communicationOptIn: false
  })

  const updateFormData = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))

    // Clear error when field is updated
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.userType) {
      newErrors.userType = "Please select your role"
    }

    if (formData.isUniversityListed) {
      if (!formData.university) {
        newErrors.university = "Please select your university"
      }
    } else {
      if (!formData.universityName.trim()) {
        newErrors.universityName = "Please enter your university name"
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateStep2 = () => {
    const newErrors: Record<string, string> = {}

    if (formData.isUniversityListed && !formData.studentId) {
      newErrors.studentId = "Please enter your UniKey/Student ID"
    }

    if (!formData.email) {
      newErrors.email = "Please enter your email address"
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address"
    }

    if (!formData.password) {
      newErrors.password = "Please enter a password"
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters long"
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password"
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateStep3 = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.fullName.trim()) {
      newErrors.fullName = "Please enter your full name"
    }

    if (!formData.department.trim()) {
      newErrors.department = "Please enter your department/faculty/major"
    }

    if (formData.userType === "student" && !formData.yearOfStudy) {
      newErrors.yearOfStudy = "Please select your year of study"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateStep4 = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.termsAgreed) {
      newErrors.termsAgreed = "You must agree to the terms and conditions"
    }

    if (!formData.privacyAgreed) {
      newErrors.privacyAgreed = "You must agree to the privacy policy"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const goToNextStep = () => {
    let isValid = false

    switch (currentStep) {
      case 1:
        isValid = validateStep1()
        break
      case 2:
        isValid = validateStep2()
        break
      case 3:
        isValid = validateStep3()
        break
      case 4:
        isValid = validateStep4()
        break
    }

    if (isValid) {
      if (currentStep < 4) {
        setCurrentStep(prev => prev + 1)
      } else {
        handleSignup()
      }
    }
  }

  const goToPreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1)
    }
  }

  const handleSignup = () => {
    setIsLoading(true)

    // Simulate signup process
    setTimeout(() => {
      setIsLoading(false)
      router.push("/auth/verify")
    }, 1500)
  }

  const getPasswordStrength = (password: string): { strength: number; label: string; color: string } => {
    if (!password) return { strength: 0, label: "No password", color: "bg-gray-300" }

    let strength = 0
    if (password.length >= 8) strength += 1
    if (/[A-Z]/.test(password)) strength += 1
    if (/[0-9]/.test(password)) strength += 1
    if (/[^A-Za-z0-9]/.test(password)) strength += 1

    const strengthMap = [
      { label: "Very weak", color: "bg-destructive" },
      { label: "Weak", color: "bg-orange-500" },
      { label: "Medium", color: "bg-yellow-500" },
      { label: "Strong", color: "bg-green-500" },
      { label: "Very strong", color: "bg-green-600" }
    ]

    return {
      strength: (strength / 4) * 100,
      label: strengthMap[strength].label,
      color: strengthMap[strength].color
    }
  }

  const renderStepForm = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold">User Type Selection</h2>
              <p className="text-muted-foreground">Tell us who you are</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="user-type">I am a</Label>
              <RadioGroup
                value={formData.userType}
                onValueChange={(value) => updateFormData('userType', value)}
                className="flex space-x-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="student" id="student" />
                  <Label htmlFor="student">Student</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="faculty" id="faculty" />
                  <Label htmlFor="faculty">Faculty/Staff</Label>
                </div>
              </RadioGroup>
              {errors.userType && <p className="text-sm text-destructive">{errors.userType}</p>}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="university">University</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-auto px-2 py-1 text-xs"
                  onClick={() => updateFormData('isUniversityListed', !formData.isUniversityListed)}
                >
                  {formData.isUniversityListed
                    ? "My university isn't listed"
                    : "Select from list"}
                </Button>
              </div>

              {formData.isUniversityListed ? (
                <Select
                  value={formData.university}
                  onValueChange={(value) => updateFormData('university', value)}
                >
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
              ) : (
                <Input
                  id="universityName"
                  placeholder="Enter your university name"
                  value={formData.universityName}
                  onChange={(e) => updateFormData('universityName', e.target.value)}
                  className={errors.universityName ? "border-destructive" : ""}
                />
              )}
              {(errors.university || errors.universityName) && (
                <p className="text-sm text-destructive">
                  {errors.university || errors.universityName}
                </p>
              )}
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold">Account Details</h2>
              <p className="text-muted-foreground">Create your login credentials</p>
            </div>

            {formData.isUniversityListed && (
              <div className="space-y-2">
                <Label htmlFor="studentId">UniKey/Student ID</Label>
                <Input
                  id="studentId"
                  value={formData.studentId}
                  onChange={(e) => updateFormData('studentId', e.target.value)}
                  className={errors.studentId ? "border-destructive" : ""}
                />
                {errors.studentId && <p className="text-sm text-destructive">{errors.studentId}</p>}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">
                {formData.isUniversityListed ? "University Email" : "Email"}
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => updateFormData('email', e.target.value)}
                className={errors.email ? "border-destructive" : ""}
                placeholder="youremail@example.com"
              />
              {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
            </div>

            {!formData.isUniversityListed && (
              <div className="space-y-2">
                <Label htmlFor="joinMessage">Request to Join Message (Optional)</Label>
                <Textarea
                  id="joinMessage"
                  placeholder="Tell us why you want to join TeamSync"
                  value={formData.joinMessage}
                  onChange={(e) => updateFormData('joinMessage', e.target.value)}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => updateFormData('password', e.target.value)}
                className={errors.password ? "border-destructive" : ""}
              />
              {formData.password && (
                <div className="mt-2 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span>Password strength:</span>
                    <span>{getPasswordStrength(formData.password).label}</span>
                  </div>
                  <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${getPasswordStrength(formData.password).color} transition-all duration-300`}
                      style={{ width: `${getPasswordStrength(formData.password).strength}%` }}
                    ></div>
                  </div>
                </div>
              )}
              {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => updateFormData('confirmPassword', e.target.value)}
                className={errors.confirmPassword ? "border-destructive" : ""}
              />
              {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword}</p>}
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold">Personal Details</h2>
              <p className="text-muted-foreground">Tell us more about yourself</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                value={formData.fullName}
                onChange={(e) => updateFormData('fullName', e.target.value)}
                className={errors.fullName ? "border-destructive" : ""}
              />
              {errors.fullName && <p className="text-sm text-destructive">{errors.fullName}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="department">
                {formData.userType === "student" ? "Department/Faculty/Major" : "Department/Faculty"}
              </Label>
              <Input
                id="department"
                value={formData.department}
                onChange={(e) => updateFormData('department', e.target.value)}
                className={errors.department ? "border-destructive" : ""}
              />
              {errors.department && <p className="text-sm text-destructive">{errors.department}</p>}
            </div>

            {formData.userType === "student" && (
              <div className="space-y-2">
                <Label htmlFor="yearOfStudy">Year of Study</Label>
                <Select
                  value={formData.yearOfStudy}
                  onValueChange={(value) => updateFormData('yearOfStudy', value)}
                >
                  <SelectTrigger id="yearOfStudy" className={errors.yearOfStudy ? "border-destructive" : ""}>
                    <SelectValue placeholder="Select your year of study" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1st Year</SelectItem>
                    <SelectItem value="2">2nd Year</SelectItem>
                    <SelectItem value="3">3rd Year</SelectItem>
                    <SelectItem value="4">4th Year</SelectItem>
                    <SelectItem value="5">5th Year</SelectItem>
                    <SelectItem value="postgrad">Postgraduate</SelectItem>
                    <SelectItem value="phd">PhD</SelectItem>
                  </SelectContent>
                </Select>
                {errors.yearOfStudy && <p className="text-sm text-destructive">{errors.yearOfStudy}</p>}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="profilePicture">Profile Picture (Optional)</Label>
              <div className="flex items-center justify-center border-2 border-dashed border-muted-foreground/25 rounded-lg h-32 bg-muted/50">
                <div className="text-center">
                  <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    Drag and drop or click to upload
                  </p>
                </div>
              </div>
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold">Terms & Privacy</h2>
              <p className="text-muted-foreground">Please review and agree to the following</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-4">
                <div className="rounded-lg border p-4 bg-muted/50">
                  <h3 className="font-medium mb-2">Terms & Conditions</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    By using TeamSync, you agree to the terms and conditions which cover usage of the platform, content policies,
                    dispute resolution, and acceptable use practices. You must be over 16 years old to use this service.
                  </p>
                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="termsAgreed"
                      checked={formData.termsAgreed}
                      onCheckedChange={(checked) => updateFormData('termsAgreed', checked === true)}
                    />
                    <Label htmlFor="termsAgreed" className="text-sm">
                      I have read and agree to the
                      <Link href="#" className="text-primary hover:underline ml-1">
                        Terms and Conditions
                      </Link>
                    </Label>
                  </div>
                  {errors.termsAgreed && <p className="text-sm text-destructive mt-2">{errors.termsAgreed}</p>}
                </div>

                <div className="rounded-lg border p-4 bg-muted/50">
                  <h3 className="font-medium mb-2">Privacy Policy</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    TeamSync collects and processes your personal information to provide our services. This includes
                    storing your profile information, usage data, and communications within the platform.
                  </p>
                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="privacyAgreed"
                      checked={formData.privacyAgreed}
                      onCheckedChange={(checked) => updateFormData('privacyAgreed', checked === true)}
                    />
                    <Label htmlFor="privacyAgreed" className="text-sm">
                      I have read and agree to the
                      <Link href="#" className="text-primary hover:underline ml-1">
                        Privacy Policy
                      </Link>
                    </Label>
                  </div>
                  {errors.privacyAgreed && <p className="text-sm text-destructive mt-2">{errors.privacyAgreed}</p>}
                </div>

                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="communicationOptIn"
                    checked={formData.communicationOptIn}
                    onCheckedChange={(checked) => updateFormData('communicationOptIn', checked === true)}
                  />
                  <Label htmlFor="communicationOptIn" className="text-sm">
                    I would like to receive updates about new features, tips, and educational content
                    (you can unsubscribe at any time)
                  </Label>
                </div>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-background w-full">
      <div className="flex min-h-screen flex-col w-full">
        <header className="sticky top-0 z-10 border-b bg-background w-full">
          <div className="container max-w-full px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between py-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
                <Users className="h-5 w-5" />
              </div>
              <span className="text-xl font-bold">TeamSync</span>
            </div>
            <Link href="/auth/login" className="text-sm font-medium text-muted-foreground hover:text-primary">
              Already have an account? Sign in
            </Link>
          </div>
        </header>

        <main className="flex-1 w-full py-6 md:py-12">
          <div className="container max-w-full px-4 sm:px-6 lg:px-8">
            <div className="max-w-screen-md mx-auto space-y-6">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold">Create your account</h1>
                <p className="text-muted-foreground">
                  Join TeamSync to collaborate with your university peers
                </p>
              </div>

              <div className="relative">
                <Progress value={(currentStep / 4) * 100} className="h-2" />
                <div className="flex justify-between text-xs text-muted-foreground mt-2">
                  <span className={currentStep >= 1 ? "text-primary font-medium" : ""}>User Type</span>
                  <span className={currentStep >= 2 ? "text-primary font-medium" : ""}>Account</span>
                  <span className={currentStep >= 3 ? "text-primary font-medium" : ""}>Personal</span>
                  <span className={currentStep >= 4 ? "text-primary font-medium" : ""}>Terms</span>
                </div>
              </div>

              <div className="bg-background rounded-lg border p-6 shadow-sm">
                {renderStepForm()}

                <div className="flex justify-between mt-8">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={goToPreviousStep}
                    disabled={currentStep === 1}
                  >
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>

                  <Button
                    type="button"
                    onClick={goToNextStep}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : currentStep < 4 ? (
                      <>
                        Next
                        <ChevronRight className="ml-2 h-4 w-4" />
                      </>
                    ) : (
                      "Create Account"
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
