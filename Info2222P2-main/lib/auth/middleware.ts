import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { verifyToken, isTokenExpired } from "./jwt";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { validateSession } from "@/lib/security/sessionProtection";
import { performSecurityCheck } from "@/lib/security";
import { SecurityEventType, logSecurityEventFromRequest } from "@/lib/security/audit";

// Auth middleware for API routes
export async function withAuth(
  request: NextRequest,
  handler: (req: NextRequest, userId: string) => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    // Get token from header
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Unauthorized - Missing or invalid authentication token" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const decoded = verifyToken(token);
    if (!decoded || !decoded.sub) {
      return NextResponse.json(
        { error: "Unauthorized - Invalid authentication token" },
        { status: 401 }
      );
    }

    // Check if token is expired
    if (isTokenExpired(token)) {
      return NextResponse.json(
        { error: "Unauthorized - Token expired" },
        { status: 401 }
      );
    }

    // Call the handler with the authenticated user ID
    return await handler(request, decoded.sub);
  } catch (error) {
    console.error("Authentication error:", error);
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 500 }
    );
  }
}

// NextAuth middleware for API routes (alternative approach)
export async function withNextAuth(
  req: NextRequest,
  handler: (req: NextRequest, userId: string) => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    // Perform security check on the request
    const securityCheck = performSecurityCheck(req);
    if (!securityCheck.isSecure && process.env.NODE_ENV === "production") {
      // Log security issues
      logSecurityEventFromRequest(
        SecurityEventType.ACCESS_DENIED,
        req,
        undefined,
        {
          reason: "Security check failed",
          issues: securityCheck.issues
        }
      );

      return NextResponse.json(
        { error: "Request security validation failed" },
        { status: 403 }
      );
    }

    // Validate session first (preferred auth method)
    const sessionValidation = validateSession(req);
    if (sessionValidation.valid && sessionValidation.userId) {
      // Session is valid, execute handler with user ID
      return handler(req, sessionValidation.userId);
    }

    // If session validation fails, fall back to JWT token validation
    const jwtToken = req.cookies.get("jwt_token")?.value;
    if (!jwtToken) {
      // No JWT token found, authentication failed
      logSecurityEventFromRequest(
        SecurityEventType.ACCESS_DENIED,
        req,
        undefined,
        { reason: "No authentication token found" }
      );

      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Verify JWT token
    try {
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        throw new Error("JWT_SECRET environment variable not set");
      }

      const decodedToken = jwt.verify(jwtToken, jwtSecret) as {
        userId: string;
        [key: string]: any;
      };

      // Check if token has necessary data
      if (!decodedToken || !decodedToken.userId) {
        throw new Error("Invalid token payload");
      }

      // Execute handler with user ID from the token
      return handler(req, decodedToken.userId);
    } catch (error) {
      // JWT validation failed
      let errorMessage = "Invalid or expired authentication token";
      let statusCode = 401;

      if (error instanceof Error && error.name === "TokenExpiredError") {
        errorMessage = "Authentication token has expired";
      } else if (error instanceof Error && error.name === "JsonWebTokenError") {
        errorMessage = "Invalid authentication token";
      } else if (error instanceof Error && error.message === "JWT_SECRET environment variable not set") {
        errorMessage = "Authentication service configuration error";
        statusCode = 500;
      }

      // Log the authentication failure
      logSecurityEventFromRequest(
        SecurityEventType.AUTH_FAILURE,
        req,
        undefined,
        {
          reason: errorMessage,
          error: error instanceof Error ? error.message : "Unknown error"
        }
      );

      // Clear invalid tokens
      const response = NextResponse.json(
        { error: errorMessage },
        { status: statusCode }
      );
      response.cookies.delete("jwt_token");
      return response;
    }
  } catch (error) {
    // Unexpected error
    console.error("Auth middleware error:", error);

    // Log the error
    logSecurityEventFromRequest(
      SecurityEventType.AUTH_FAILURE,
      req,
      undefined,
      { error: error instanceof Error ? error.message : "Unknown error" }
    );

    return NextResponse.json(
      { error: "An error occurred during authentication" },
      { status: 500 }
    );
  }
}

// Role-based access control middleware
export async function withRole(
  request: NextRequest,
  handler: (req: NextRequest, userId: string) => Promise<NextResponse>,
  requiredRole: string
): Promise<NextResponse> {
  try {
    // Get token from header
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Unauthorized - Missing or invalid authentication token" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const decoded = verifyToken(token);
    if (!decoded || !decoded.sub) {
      return NextResponse.json(
        { error: "Unauthorized - Invalid authentication token" },
        { status: 401 }
      );
    }

    // Check if token is expired
    if (isTokenExpired(token)) {
      return NextResponse.json(
        { error: "Unauthorized - Token expired" },
        { status: 401 }
      );
    }

    // Check if user has required role
    if (!decoded.role || decoded.role !== requiredRole) {
      return NextResponse.json(
        { error: "Forbidden - Insufficient permissions" },
        { status: 403 }
      );
    }

    // Call the handler with the authenticated user ID
    return await handler(request, decoded.sub);
  } catch (error) {
    console.error("Authentication error:", error);
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 500 }
    );
  }
}

/**
 * Middleware to only allow specific roles to access a route
 *
 * @param req NextRequest object
 * @param allowedRoles Array of allowed role names
 * @param handler Handler function to call if authorization succeeds
 * @returns Response from handler or error response
 */
export async function withRoleAuth(
  req: NextRequest,
  allowedRoles: string[],
  handler: (req: NextRequest, userId: string) => Promise<NextResponse>
): Promise<NextResponse> {
  return withNextAuth(req, async (req, userId) => {
    try {
      // Fetch user's roles from the database
      // This would typically be done with a database query
      // For simplicity, we're using a placeholder implementation
      const userRoles = await getUserRoles(userId);

      // Check if user has any of the allowed roles
      const hasAllowedRole = userRoles.some(role => allowedRoles.includes(role));

      if (!hasAllowedRole) {
        // User doesn't have required role
        logSecurityEventFromRequest(
          SecurityEventType.ACCESS_DENIED,
          req,
          userId,
          {
            reason: "Insufficient permissions",
            requiredRoles: allowedRoles,
            userRoles
          }
        );

        return NextResponse.json(
          { error: "You do not have permission to access this resource" },
          { status: 403 }
        );
      }

      // User has required role, execute handler
      return handler(req, userId);
    } catch (error) {
      // Unexpected error
      console.error("Role auth middleware error:", error);

      // Log the error
      logSecurityEventFromRequest(
        SecurityEventType.ACCESS_DENIED,
        req,
        userId,
        { error: error instanceof Error ? error.message : "Unknown error" }
      );

      return NextResponse.json(
        { error: "An error occurred during authorization" },
        { status: 500 }
      );
    }
  });
}

/**
 * Get roles for a user (placeholder implementation)
 * In a real application, this would fetch roles from a database
 *
 * @param userId User ID to get roles for
 * @returns Array of role names
 */
async function getUserRoles(userId: string): Promise<string[]> {
  // This is a placeholder implementation
  // In a real application, you would fetch this from your database

  // Example implementation:
  // const user = await prisma.user.findUnique({
  //   where: { id: userId },
  //   include: { roles: true },
  // });
  // return user?.roles.map(role => role.name) || [];

  // For now, return a default role
  return ["user"];
}
