import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { invalidateSession } from "@/lib/security/sessionProtection";
import { withNextAuth } from "@/lib/auth/middleware";
import { SecurityEventType, logSecurityEventFromRequest } from "@/lib/security/audit";

export async function POST(request: NextRequest) {
  return withNextAuth(request, async (req, userId) => {
    try {
      // Get session token from cookies
      const sessionToken = cookies().get("auth_session")?.value;

      if (sessionToken) {
        // Invalidate the session
        invalidateSession(sessionToken);
      }

      // Always clear all auth-related cookies, even if session token wasn't found
      const cookieStore = cookies();
      cookieStore.delete("auth_session");
      cookieStore.delete("jwt_token");

      // Log the logout event
      logSecurityEventFromRequest(
        SecurityEventType.AUTH_SUCCESS,
        request,
        userId,
        { action: "logout", success: true }
      );

      // Return success response
      return NextResponse.json(
        { success: true, message: "Logged out successfully" },
        {
          status: 200,
          headers: {
            // Add cache control headers to prevent caching of logout response
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
          }
        }
      );
    } catch (error) {
      console.error("Logout error:", error);

      // Log the error
      logSecurityEventFromRequest(
        SecurityEventType.AUTH_FAILURE,
        request,
        userId,
        { action: "logout", error: error instanceof Error ? error.message : "Unknown error" }
      );

      // Still clear cookies even if there was an error
      const cookieStore = cookies();
      cookieStore.delete("auth_session");
      cookieStore.delete("jwt_token");

      // Return error response
      return NextResponse.json(
        { error: "An error occurred during logout" },
        { status: 500 }
      );
    }
  });
}

// Also handle GET requests for logout (less secure but sometimes needed for redirects)
export async function GET(request: NextRequest) {
  // Simply call the POST handler for logout
  return POST(request);
}
