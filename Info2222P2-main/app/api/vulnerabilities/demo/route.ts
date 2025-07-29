import { NextRequest, NextResponse } from "next/server";

/**
 * THIS FILE CONTAINS DELIBERATELY VULNERABLE CODE FOR EDUCATIONAL PURPOSES ONLY
 * DO NOT USE THESE PATTERNS IN PRODUCTION CODE
 */

interface User {
  id: number;
  username: string;
  password: string;
  isAdmin: boolean;
}

// Mock database for demonstration
const MOCK_USERS: User[] = [
  { id: 1, username: "admin", password: "admin123", isAdmin: true },
  { id: 2, username: "user", password: "password123", isAdmin: false },
];

/**
 * VULNERABILITY 1: SQL Injection
 * This endpoint demonstrates SQL injection vulnerability by constructing a query with string concatenation
 * Solution: Use parameterized queries (prepared statements)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get("username") || "";

  try {
    // VULNERABLE CODE: Direct string concatenation in SQL query
    // In a real database, this would be executed like:
    // const query = `SELECT * FROM users WHERE username = '${username}'`;

    // Simulate a SQL injection attack where username = "' OR '1'='1"
    // This would result in: SELECT * FROM users WHERE username = '' OR '1'='1'
    // Which would return all users

    let results: User[] = [];

    if (username.includes("'")) {
      // Simulate successful SQL injection
      results = MOCK_USERS;
    } else {
      // Normal flow - find user by exact username
      results = MOCK_USERS.filter(user => user.username === username);
    }

    return NextResponse.json({
      message: "VULNERABLE SQL QUERY DEMONSTRATION",
      query: `SELECT * FROM users WHERE username = '${username}'`,
      results,
      explanation: "This endpoint is vulnerable to SQL injection. Try using ?username=admin' OR '1'='1",
      mitigation: "Use parameterized queries with prepared statements instead of string concatenation"
    });
  } catch (error) {
    return NextResponse.json({ error: "Error executing query" }, { status: 500 });
  }
}

/**
 * VULNERABILITY 2: Insecure Password Storage
 * This endpoint demonstrates insecure password handling by storing and checking plaintext passwords
 * Solution: Use secure hashing with salt (bcrypt, Argon2, etc.)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password are required" },
        { status: 400 }
      );
    }

    // VULNERABLE CODE: Plain text password comparison
    const user = MOCK_USERS.find(
      u => u.username === username && u.password === password
    );

    if (user) {
      // VULNERABLE CODE: Returning sensitive information
      return NextResponse.json({
        message: "VULNERABLE AUTHENTICATION DEMONSTRATION",
        user,
        explanation: "This endpoint demonstrates multiple vulnerabilities:\n1. Passwords stored in plaintext\n2. Returning full user object including password\n3. No rate limiting for brute force protection",
        mitigation: "1. Use strong hashing algorithms like bcrypt or Argon2\n2. Never return sensitive data\n3. Implement rate limiting and account lockouts"
      });
    } else {
      return NextResponse.json(
        { error: "Invalid username or password" },
        { status: 401 }
      );
    }
  } catch (error) {
    return NextResponse.json({ error: "Error processing request" }, { status: 500 });
  }
}

/**
 * VULNERABILITY 3: XSS (Cross-Site Scripting)
 * This endpoint demonstrates XSS vulnerability by reflecting user input without sanitization
 * Solution: Sanitize user input and use proper context-aware escaping
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { comment } = body;

    if (!comment) {
      return NextResponse.json(
        { error: "Comment is required" },
        { status: 400 }
      );
    }

    // VULNERABLE CODE: No sanitization of user input
    // This allows attackers to inject scripts that will be executed when rendered
    // Example: {"comment": "<script>alert('XSS Attack')</script>"}

    return NextResponse.json({
      message: "VULNERABLE XSS DEMONSTRATION",
      userComment: comment,
      htmlRepresentation: `<div class="comment">${comment}</div>`,
      explanation: "This endpoint is vulnerable to XSS. Try sending a PUT request with: {\"comment\": \"<script>alert('XSS Attack')</script>\"}",
      mitigation: "1. Sanitize user input\n2. Use context-appropriate escaping\n3. Implement Content Security Policy (CSP)"
    });
  } catch (error) {
    return NextResponse.json({ error: "Error processing request" }, { status: 500 });
  }
}

/**
 * VULNERABILITY 4: IDOR (Insecure Direct Object Reference)
 * This endpoint demonstrates IDOR by allowing access to any user's data without proper authorization
 * Solution: Implement proper access controls and authorization checks
 */
export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // VULNERABLE CODE: No authorization check
    // Any user can access any other user's data by changing the userId parameter
    const user = MOCK_USERS.find(u => u.id === parseInt(userId));

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "VULNERABLE IDOR DEMONSTRATION",
      user,
      explanation: "This endpoint is vulnerable to IDOR. Any user can access any other user's data by changing the userId parameter.",
      mitigation: "1. Implement proper authorization checks\n2. Use indirect references\n3. Verify the requesting user has permission to access the resource"
    });
  } catch (error) {
    return NextResponse.json({ error: "Error processing request" }, { status: 500 });
  }
}
