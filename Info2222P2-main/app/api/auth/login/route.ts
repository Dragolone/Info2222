import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { authenticateUser } from "@/lib/auth/secure-auth";
import { sanitizeString } from "@/lib/security/inputSanitization";
import { getClientIp, createRateLimitKey } from "@/lib/security/rateLimit";
import { SecurityEventType, logSecurityEventFromRequest } from "@/lib/security/audit";
import { createSession } from "@/lib/security/sessionProtection";

// Import rate limiter
import rateLimit from "@/lib/security/rateLimit";

// Login attempts rate limiter - 10 attempts per 5 minutes per IP
const loginRateLimiter = rateLimit({
  interval: 5 * 60 * 1000, // 5 minutes
  limit: 10,
  uniqueTokenPerInterval: 1000, // Max number of IPs we track
});

// Validation schema for login credentials
const loginSchema = z.object({
  email: z.string().email("Invalid email address").max(255),
  password: z.string().min(1, "Password is required").max(100),
  rememberMe: z.boolean().optional().default(false),
});

export async function POST(request: NextRequest) {
  try {
    // Get client IP for rate limiting and security logging
    const clientIp = getClientIp(request.headers.get("x-forwarded-for")) || request.ip || "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";

    // Check if the connection is secure in production
    if (process.env.NODE_ENV === "production" && !request.url.startsWith("https://")) {
      logSecurityEventFromRequest(
        SecurityEventType.ACCESS_DENIED,
        request,
        undefined,
        { reason: "Insecure connection for login attempt", ip: clientIp }
      );

      return NextResponse.json(
        { error: "Login must be performed over HTTPS" },
        { status: 403 }
      );
    }

    // Apply rate limiting based on IP address
    const rateLimitKey = clientIp;

    try {
      await loginRateLimiter.check(rateLimitKey);
    } catch (error) {
      // Rate limit exceeded
      logSecurityEventFromRequest(
        SecurityEventType.RATE_LIMIT_EXCEEDED,
        request,
        undefined,
        { ip: clientIp }
      );

      return NextResponse.json(
        {
          error: "Too many login attempts",
          message: "Please try again later"
        },
        {
          status: 429,
          headers: {
            "Retry-After": "300", // 5 minutes
          }
        }
      );
    }

    // Parse and validate request body
    let body;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid JSON" },
        { status: 400 }
      );
    }

    const result = loginSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid input", details: result.error.format() },
        { status: 400 }
      );
    }

    const { email, password, rememberMe } = result.data;

    // Sanitize the email input to prevent injection attacks
    const sanitizedEmail = sanitizeString(email);

    // Authenticate user
    const user = await authenticateUser(
      sanitizedEmail,
      password,
      clientIp,
      userAgent
    );

    if (!user) {
      // Failed login attempt was already logged by authenticateUser
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Create session
    const token = createSession(user.id, request);

    // Generate JWT for API authentication
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error("JWT_SECRET environment variable not set");
      return NextResponse.json(
        { error: "Authentication service configuration error" },
        { status: 500 }
      );
    }

    const jwt_token = jwt.sign(
      {
        userId: user.id,
        username: user.username,
        email: user.email,
      },
      jwtSecret,
      {
        expiresIn: rememberMe ? "7d" : "1d", // Token expires in 1 day, or 7 days with "remember me"
      }
    );

    // Set cookies - handled by createSession, additional JWT cookie for API auth
    cookies().set({
      name: "jwt_token",
      value: jwt_token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      // Set expiration based on "remember me" option
      maxAge: rememberMe ? 7 * 24 * 60 * 60 : 24 * 60 * 60, // 7 days or 1 day in seconds
    });

    // Return success with user data (excluding sensitive fields)
    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
      message: "Login successful",
    }, {
      headers: {
        // Add security headers
        'Content-Security-Policy': "default-src 'self'; script-src 'self'",
        'X-Content-Type-Options': 'nosniff',
      }
    });
  } catch (error) {
    console.error("Login error:", error);

    // Log the error
    logSecurityEventFromRequest(
      SecurityEventType.AUTH_FAILURE,
      request,
      undefined,
      { error: error instanceof Error ? error.message : "Unknown error" }
    );

    return NextResponse.json(
      { error: "An error occurred during authentication" },
      { status: 500 }
    );
  }
}
