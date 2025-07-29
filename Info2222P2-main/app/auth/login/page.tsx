"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select"
import { EyeIcon, EyeOffIcon, Users, Loader2, ShieldAlert, Lock } from "lucide-react"
import { universities } from "@/lib/data/universities"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { verifyCertificate, securePasswordTransmission } from "@/lib/encryption/clientCrypto"

// Maximum number of login attempts before temporary lockout
const MAX_ATTEMPTS = 5;
// Lockout duration in milliseconds (15 minutes)
const LOCKOUT_DURATION = 15 * 60 * 1000;

export default function LoginPage() {
  const router = useRouter()
  const [tabValue, setTabValue] = useState("university")
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [isSecureConnection, setIsSecureConnection] = useState(false)
  const [connectionChecked, setConnectionChecked] = useState(false)
  const [loginAttempts, setLoginAttempts] = useState(0)
  const [isLockedOut, setIsLockedOut] = useState(false)
  const [lockoutEnds, setLockoutEnds] = useState<Date | null>(null)
  const [countdownTime, setCountdownTime] = useState("")
  const lockoutTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Form states
  const [uniId, setUniId] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [university, setUniversity] = useState("")
  const [rememberMe, setRememberMe] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showingPassword, setShowingPassword] = useState(false)
  const showPasswordTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Check for stored lockout information on mount
  useEffect(() => {
    // Check for secure connection
    const secure = verifyCertificate();
    setIsSecureConnection(secure);
    setConnectionChecked(true);

    // Check for lockout stored in sessionStorage
    const storedLockoutEnds = sessionStorage.getItem("loginLockoutEnds");
    const storedAttempts = sessionStorage.getItem("loginAttempts");

    if (storedLockoutEnds) {
      const lockoutEndTime = new Date(storedLockoutEnds);
      if (lockoutEndTime > new Date()) {
        // Still locked out
        setIsLockedOut(true);
        setLockoutEnds(lockoutEndTime);
        startLockoutTimer(lockoutEndTime);
      } else {
        // Lockout period has expired
        sessionStorage.removeItem("loginLockoutEnds");
        setLoginAttempts(0);
      }
    }

    if (storedAttempts && !isLockedOut) {
      setLoginAttempts(parseInt(storedAttempts, 10));
    }

    // Clean up timeout on unmount
    return () => {
      if (lockoutTimerRef.current) {
        clearTimeout(lockoutTimerRef.current);
      }
      if (showPasswordTimeoutRef.current) {
        clearTimeout(showPasswordTimeoutRef.current);
      }
    };
  }, []);

  // Start lockout timer and update countdown
  const startLockoutTimer = (endTime: Date) => {
    const updateCountdown = () => {
      const now = new Date();
      if (now >= endTime) {
        setIsLockedOut(false);
        setLockoutEnds(null);
        setLoginAttempts(0);
        sessionStorage.removeItem("loginLockoutEnds");
        sessionStorage.removeItem("loginAttempts");
        setCountdownTime("");
        return;
      }

      const diff = Math.floor((endTime.getTime() - now.getTime()) / 1000);
      const minutes = Math.floor(diff / 60);
      const seconds = diff % 60;
      setCountdownTime(`${minutes}:${seconds.toString().padStart(2, '0')}`);

      lockoutTimerRef.current = setTimeout(updateCountdown, 1000);
    };

    updateCountdown();
  };

  // Handle failed login attempt
  const handleFailedAttempt = () => {
    const newAttempts = loginAttempts + 1;
    setLoginAttempts(newAttempts);
    sessionStorage.setItem("loginAttempts", newAttempts.toString());

    if (newAttempts >= MAX_ATTEMPTS) {
      const lockoutEnd = new Date(Date.now() + LOCKOUT_DURATION);
      setIsLockedOut(true);
      setLockoutEnds(lockoutEnd);
      sessionStorage.setItem("loginLockoutEnds", lockoutEnd.toISOString());
      startLockoutTimer(lockoutEnd);
    }
  };

  // Sanitize inputs to prevent XSS
  const sanitizeInput = (input: string): string => {
    return input
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
      .trim();
  };

  // Enforce strict email format validation
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email) && email.length <= 100;
  };

  // Validate university login form
  const validateUniversityForm = () => {
    const newErrors: Record<string, string> = {}

    if (!university) {
      newErrors.university = "Please select your university";
    }

    if (!uniId) {
      newErrors.uniId = "Please enter your UniKey/Student ID";
    } else if (uniId.length < 3 || uniId.length > 30) {
      newErrors.uniId = "UniKey/Student ID must be between 3 and 30 characters";
    } else if (!/^[a-zA-Z0-9_]+$/.test(uniId)) {
      newErrors.uniId = "UniKey/Student ID can only contain letters, numbers, and underscores";
    }

    if (!password) {
      newErrors.password = "Please enter your password";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  // Validate email login form
  const validateEmailForm = () => {
    const newErrors: Record<string, string> = {}

    if (!email) {
      newErrors.email = "Please enter your email";
    } else if (!isValidEmail(email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!password) {
      newErrors.password = "Please enter your password";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  // Handle password visibility toggle with auto-hide timer
  const handleTogglePasswordVisibility = () => {
    // Clear any existing timeout
    if (showPasswordTimeoutRef.current) {
      clearTimeout(showPasswordTimeoutRef.current);
    }

    // Toggle password visibility
    setShowPassword(!showPassword);

    // If showing password, set a timeout to auto-hide after 5 seconds
    if (!showPassword) {
      showPasswordTimeoutRef.current = setTimeout(() => {
        setShowPassword(false);
      }, 5000); // Auto-hide after 5 seconds
    }
  };

  // Handle login form submission
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent login if locked out
    if (isLockedOut) {
      setErrors({
        ...errors,
        connection: `Too many failed attempts. Please try again in ${countdownTime}.`
      });
      return;
    }

    // Prevent login if connection is not secure
    if (!isSecureConnection) {
      setErrors({
        ...errors,
        connection: "Cannot log in over an insecure connection. Please use HTTPS."
      });
      return;
    }

    let isValid = false;
    if (tabValue === "university") {
      isValid = validateUniversityForm();
    } else {
      isValid = validateEmailForm();
    }

    if (isValid) {
      setIsLoading(true);

      try {
        // Create login credential payload
        const credentials = {
          email: tabValue === 'email'
            ? sanitizeInput(email)
            : `${sanitizeInput(uniId)}@${university}`,
          // Secure the password transmission
          password: await securePasswordTransmission(password)
        };

        // Add CSRF protection - you would need to ensure your backend provides a CSRF token
        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';

        // Here you would make an actual API call to your backend
        // const response = await fetch('/api/auth/login', {
        //   method: 'POST',
        //   headers: {
        //     'Content-Type': 'application/json',
        //     'X-CSRF-Token': csrfToken,
        //   },
        //   body: JSON.stringify(credentials),
        //   credentials: 'same-origin' // Include cookies for session management
        // });

        // if (!response.ok) {
        //   // Handle failed login
        //   handleFailedAttempt();
        //   throw new Error('Login failed');
        // }

        // Simulate authentication for now with a 50% chance of failure for testing
        const simulateSuccess = Math.random() > 0.5;

        setTimeout(() => {
          setIsLoading(false);

          if (simulateSuccess) {
            // Reset login attempts on success
            setLoginAttempts(0);
            sessionStorage.removeItem("loginAttempts");
            sessionStorage.removeItem("loginLockoutEnds");

            // Simulate successful login
            router.push("/dashboard");
          } else {
            // Handle failed login
            handleFailedAttempt();
            setErrors({
              ...errors,
              auth: "Invalid username or password"
            });
          }
        }, 1500);
      } catch (error) {
        setIsLoading(false);
        handleFailedAttempt();
        setErrors({
          ...errors,
          connection: error instanceof Error ? error.message : "An unknown error occurred"
        });
      }
    }
  }

  return (
    <div className="flex min-h-screen w-full">
      <div className="flex-1 hidden lg:block bg-muted/50">
        <div className="flex items-center justify-center h-full p-8">
          <div className="max-w-md">
            <h1 className="text-3xl font-bold mb-6">Welcome to TeamSync</h1>
            <p className="text-muted-foreground mb-4">
              The all-in-one platform for university team collaboration and project management.
            </p>
            <ul className="space-y-2">
              {[
                "Integrated task management with Kanban boards",
                "Real-time messaging and video meetings",
                "Shared calendar for team scheduling",
                "File sharing and collaborative document editing",
                "Progress tracking and analytics",
              ].map((feature, i) => (
                <li key={i} className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="flex items-center gap-2 mb-6">
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
              <Users className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold">TeamSync</span>
          </div>

          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
              <p className="text-muted-foreground">Enter your credentials to access your account</p>
            </div>

            {connectionChecked && !isSecureConnection && (
              <Alert variant="destructive">
                <ShieldAlert className="h-4 w-4" />
                <AlertTitle>Insecure Connection</AlertTitle>
                <AlertDescription>
                  Your connection is not secure. To protect your credentials, please use HTTPS.
                </AlertDescription>
              </Alert>
            )}

            {errors.connection && (
              <Alert variant="destructive">
                <ShieldAlert className="h-4 w-4" />
                <AlertTitle>Security Error</AlertTitle>
                <AlertDescription>{errors.connection}</AlertDescription>
              </Alert>
            )}

            {errors.auth && (
              <Alert variant="destructive">
                <ShieldAlert className="h-4 w-4" />
                <AlertTitle>Authentication Error</AlertTitle>
                <AlertDescription>{errors.auth}</AlertDescription>
              </Alert>
            )}

            {isLockedOut && (
              <Alert variant="destructive">
                <Lock className="h-4 w-4" />
                <AlertTitle>Account Temporarily Locked</AlertTitle>
                <AlertDescription>
                  Too many failed login attempts. Please try again in {countdownTime}.
                </AlertDescription>
              </Alert>
            )}

            <Tabs defaultValue="university" value={tabValue} onValueChange={setTabValue} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="university">University Login</TabsTrigger>
                <TabsTrigger value="email">Email Login</TabsTrigger>
              </TabsList>

              <TabsContent value="university" className="space-y-4 mt-4">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="university">University</Label>
                    <Select value={university} onValueChange={setUniversity} disabled={isLockedOut}>
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
                    <Label htmlFor="uniId">UniKey/Student ID</Label>
                    <Input
                      id="uniId"
                      value={uniId}
                      onChange={(e) => setUniId(e.target.value)}
                      className={errors.uniId ? "border-destructive" : ""}
                      maxLength={30}
                      pattern="^[a-zA-Z0-9_]+$"
                      title="UniKey/Student ID can only contain letters, numbers, and underscores"
                      aria-invalid={errors.uniId ? "true" : "false"}
                      disabled={isLockedOut}
                      autoComplete="username"
                    />
                    {errors.uniId && <p className="text-sm text-destructive">{errors.uniId}</p>}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="uniPassword">Password</Label>
                      <Link href="/auth/reset-password" className="text-sm text-primary hover:underline">
                        Forgot password?
                      </Link>
                    </div>
                    <div className="relative">
                      <Input
                        id="uniPassword"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={errors.password ? "border-destructive pr-10" : "pr-10"}
                        maxLength={100}
                        disabled={isLockedOut}
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 flex items-center pr-3"
                        onClick={handleTogglePasswordVisibility}
                        disabled={isLockedOut}
                        tabIndex={-1}
                      >
                        {showPassword ? (
                          <EyeOffIcon className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <EyeIcon className="h-4 w-4 text-muted-foreground" />
                        )}
                      </button>
                    </div>
                    {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="remember"
                      checked={rememberMe}
                      onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                      disabled={isLockedOut}
                    />
                    <Label htmlFor="remember" className="text-sm">
                      Remember me
                    </Label>
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isLoading || isLockedOut}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Logging in...
                      </>
                    ) : (
                      "Log In"
                    )}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="email" className="space-y-4 mt-4">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={errors.email ? "border-destructive" : ""}
                      maxLength={100}
                      disabled={isLockedOut}
                      autoComplete="email"
                    />
                    {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="emailPassword">Password</Label>
                      <Link href="/auth/reset-password" className="text-sm text-primary hover:underline">
                        Forgot password?
                      </Link>
                    </div>
                    <div className="relative">
                      <Input
                        id="emailPassword"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={errors.password ? "border-destructive pr-10" : "pr-10"}
                        maxLength={100}
                        disabled={isLockedOut}
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 flex items-center pr-3"
                        onClick={handleTogglePasswordVisibility}
                        disabled={isLockedOut}
                        tabIndex={-1}
                      >
                        {showPassword ? (
                          <EyeOffIcon className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <EyeIcon className="h-4 w-4 text-muted-foreground" />
                        )}
                      </button>
                    </div>
                    {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="rememberEmail"
                      checked={rememberMe}
                      onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                      disabled={isLockedOut}
                    />
                    <Label htmlFor="rememberEmail" className="text-sm">
                      Remember me
                    </Label>
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isLoading || isLockedOut}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Logging in...
                      </>
                    ) : (
                      "Log In"
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            <div className="text-center text-sm">
              Don't have an account?{" "}
              <Link href="/auth/signup" className="text-primary hover:underline">
                Sign up
              </Link>
            </div>
          </div>

          <div className="mt-6 text-center text-sm">
            {isSecureConnection ? (
              <p className="text-green-600 flex items-center justify-center gap-1">
                <span className="h-2 w-2 rounded-full bg-green-600"></span>
                Secure connection verified
              </p>
            ) : (
              <p className="text-destructive flex items-center justify-center gap-1">
                <span className="h-2 w-2 rounded-full bg-destructive"></span>
                Insecure connection - TLS required
              </p>
            )}
          </div>

          {loginAttempts > 0 && !isLockedOut && (
            <div className="mt-2 text-center text-xs text-muted-foreground">
              Failed attempts: {loginAttempts} of {MAX_ATTEMPTS}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
