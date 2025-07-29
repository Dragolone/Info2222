import { NextRequest, NextResponse } from "next/server";
import { withNextAuth } from "@/lib/auth/middleware";
import { verifyPassword } from "@/lib/encryption/password";
import { z } from "zod";
import { createHmac } from "crypto";
import DOMPurify from "dompurify";

/**
 * THIS FILE DEMONSTRATES SECURE IMPLEMENTATIONS
 * Compare with the vulnerable implementations in /api/vulnerabilities/demo
 */

// Mock database for demonstration
interface User {
  id: string;
  username: string;
  hashedPassword: string;
  isAdmin: boolean;
}

const MOCK_USERS: User[] = [
  {
    id: "usr_01",
    username: "admin",
    // In a real app, this would be an actual bcrypt/argon2 hash
    hashedPassword: "$argon2id$v=19$m=65536,t=3,p=4$RANDOMLY_GENERATED_SALT$HASHED_PASSWORD_VALUE",
    isAdmin: true
  },
  {
    id: "usr_02",
    username: "user",
    hashedPassword: "$argon2id$v=19$m=65536,t=3,p=4$ANOTHER_SALT$ANOTHER_HASH_VALUE",
    isAdmin: false
  },
];

/**
 * SECURE IMPLEMENTATION 1: SQL Injection Protection
 * This endpoint demonstrates protection against SQL injection by using parameterized queries
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get("username") || "";

  // Define a schema for validation
  const querySchema = z.object({
    username: z.string().min(1).max(50),
  });

  try {
    // Validate input parameters
    const validation = querySchema.safeParse({ username });
    if (!validation.success) {
      return NextResponse.json({
        error: "Invalid input",
        details: validation.error.format()
      }, { status: 400 });
    }

    // In a real database system, you would use parameterized queries like:
    // const query = "SELECT * FROM users WHERE username = ?";
    // const results = await db.query(query, [username]);

    // Safe approach - exact matching after validation
    const results = MOCK_USERS
      .filter(user => user.username === username)
      .map(user => ({
        id: user.id,
        username: user.username,
        isAdmin: user.isAdmin
        // Note: We don't return the password hash
      }));

    return NextResponse.json({
      message: "SECURE SQL QUERY DEMONSTRATION",
      secureQuery: "SELECT id, username, isAdmin FROM users WHERE username = ?",
      bindParameters: [username],
      results,
      explanation: "This endpoint is protected against SQL injection by using parameterized queries and input validation"
    });
  } catch (error) {
    console.error("Error executing query:", error);
    return NextResponse.json({ error: "Error executing query" }, { status: 500 });
  }
}

/**
 * SECURE IMPLEMENTATION 2: Secure Password Handling
 * This endpoint demonstrates secure password verification using proper hashing
 */
export async function POST(request: NextRequest) {
  try {
    // Define schema for validation
    const loginSchema = z.object({
      username: z.string().min(3).max(50),
      password: z.string().min(8).max(100),
    });

    // Validate input
    const body = await request.json();
    const validation = loginSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({
        error: "Invalid input",
        details: validation.error.format()
      }, { status: 400 });
    }

    const { username, password } = validation.data;

    // Find the user by username only
    const user = MOCK_USERS.find(u => u.username === username);

    if (!user) {
      // Use a constant-time comparison to prevent timing attacks
      // Also wait a fixed time to prevent timing attacks revealing non-existent users
      await new Promise(resolve => setTimeout(resolve, 500));

      return NextResponse.json(
        { error: "Invalid username or password" },
        { status: 401 }
      );
    }

    // In a real implementation, this would use a proper password verification:
    // const passwordMatches = await verifyPassword(user.hashedPassword, password);

    // Simulate password verification (always fails in this demo)
    const passwordMatches = false;

    if (passwordMatches) {
      // Note: We only return necessary user data, never passwords or hashes
      return NextResponse.json({
        message: "SECURE AUTHENTICATION DEMONSTRATION",
        user: {
          id: user.id,
          username: user.username,
          isAdmin: user.isAdmin
        },
        explanation: "This endpoint demonstrates secure authentication practices:\n1. Passwords hashed with strong algorithm\n2. Only necessary user data returned\n3. Input validation\n4. Protection against timing attacks"
      });
    } else {
      return NextResponse.json(
        { error: "Invalid username or password" },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error("Error processing request:", error);
    return NextResponse.json({ error: "Error processing request" }, { status: 500 });
  }
}

/**
 * SECURE IMPLEMENTATION 3: XSS Protection
 * This endpoint demonstrates protection against XSS by sanitizing user input
 */
export async function PUT(request: NextRequest) {
  try {
    // Define schema for validation
    const commentSchema = z.object({
      comment: z.string().min(1).max(1000),
    });

    // Validate input
    const body = await request.json();
    const validation = commentSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({
        error: "Invalid input",
        details: validation.error.format()
      }, { status: 400 });
    }

    const { comment } = validation.data;

    // Sanitize user input to prevent XSS
    // In a browser environment, we would use:
    // const sanitizedComment = DOMPurify.sanitize(comment);
    // For this server-side example, we'll use a simple approach:
    const sanitizedComment = comment
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

    return NextResponse.json({
      message: "SECURE XSS PROTECTION DEMONSTRATION",
      rawComment: comment,
      sanitizedComment: sanitizedComment,
      safeHtmlRepresentation: `<div class="comment">${sanitizedComment}</div>`,
      explanation: "This endpoint is protected against XSS by sanitizing user input before rendering"
    });
  } catch (error) {
    console.error("Error processing request:", error);
    return NextResponse.json({ error: "Error processing request" }, { status: 500 });
  }
}

/**
 * SECURE IMPLEMENTATION 4: Proper Authorization
 * This endpoint demonstrates proper authorization checks
 */
export async function PATCH(request: NextRequest) {
  return withNextAuth(request, async (req, userId) => {
    try {
      const { searchParams } = new URL(req.url);
      const targetUserId = searchParams.get("userId");

      if (!targetUserId) {
        return NextResponse.json(
          { error: "User ID is required" },
          { status: 400 }
        );
      }

      // Find the requesting user (authenticated via middleware)
      const requestingUser = MOCK_USERS.find(u => u.id === userId);

      if (!requestingUser) {
        return NextResponse.json(
          { error: "Authenticated user not found" },
          { status: 404 }
        );
      }

      // Find the target user
      const targetUser = MOCK_USERS.find(u => u.id === targetUserId);

      if (!targetUser) {
        return NextResponse.json(
          { error: "Target user not found" },
          { status: 404 }
        );
      }

      // Proper authorization check - users can only access their own data
      // unless they are admins
      if (targetUserId !== userId && !requestingUser.isAdmin) {
        return NextResponse.json(
          { error: "You do not have permission to access this resource" },
          { status: 403 }
        );
      }

      // Return only non-sensitive user data
      return NextResponse.json({
        message: "SECURE AUTHORIZATION DEMONSTRATION",
        user: {
          id: targetUser.id,
          username: targetUser.username,
          isAdmin: targetUser.isAdmin
        },
        explanation: "This endpoint demonstrates proper authorization:\n1. Authentication via middleware\n2. Authorization checks to verify permission\n3. Users can only access their own data unless they have admin privileges"
      });
    } catch (error) {
      console.error("Error processing request:", error);
      return NextResponse.json({ error: "Error processing request" }, { status: 500 });
    }
  });
}
