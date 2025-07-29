import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { withNextAuth } from "@/lib/auth/middleware";
import { aesEncrypt } from "@/lib/encryption/crypto";
// Import WebSocket broadcasting function
const { broadcastToGroup } = require("../../../server");

// Import rate limiter for API endpoints
import rateLimit from "@/lib/security/rateLimit";

// Rate limit configuration for message sending
// 30 messages per minute (one every 2 seconds)
const messageSendLimiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500, // Max number of users per interval
  limit: 30, // 30 requests per interval
});

// Validation schema for sending a message
const sendMessageSchema = z.object({
  groupId: z.string().uuid("Invalid group ID"),
  content: z.string().min(1, "Message cannot be empty").max(5000, "Message is too long"),
  iv: z.string().optional().refine(
    val => !val || /^[0-9a-f]+$/.test(val),
    "IV must be a hex string"
  ), // For E2EE messages, client provides the IV
  isE2EE: z.boolean().optional().default(false), // Flag for E2EE messages
  messageNonce: z.string().optional(), // Optional nonce for protection against replay attacks
});

// Validation schema for listing messages
const listMessagesSchema = z.object({
  groupId: z.string().uuid("Invalid group ID"),
  limit: z.number().int().min(1).max(100).optional().default(50),
  cursor: z.string().optional().refine(
    val => !val || /^[0-9a-fA-F-]+$/.test(val),
    "Cursor must be a valid UUID"
  ),
});

// Track recent message nonces to prevent replay attacks
const recentNonces = new Map<string, Set<string>>();

// Clean up old nonces periodically (keep for 5 minutes)
setInterval(() => {
  const cutoff = Date.now() - 5 * 60 * 1000; // 5 minutes ago

  for (const [userId, nonces] of recentNonces.entries()) {
    if (nonces.size === 0) {
      recentNonces.delete(userId);
    }
  }
}, 10 * 60 * 1000); // Run every 10 minutes

// Standardized error responses to prevent information leakage
const ERROR_RESPONSES = {
  UNAUTHORIZED: {
    error: "Authentication required",
    code: "UNAUTHORIZED",
    status: 401
  },
  FORBIDDEN: {
    error: "You do not have permission to access this resource",
    code: "FORBIDDEN",
    status: 403
  },
  NOT_FOUND: {
    error: "The requested resource was not found",
    code: "NOT_FOUND",
    status: 404
  },
  VALIDATION_FAILED: {
    error: "The request data failed validation",
    code: "VALIDATION_FAILED",
    status: 400
  },
  RATE_LIMITED: {
    error: "Rate limit exceeded",
    code: "RATE_LIMITED",
    status: 429
  },
  SERVER_ERROR: {
    error: "An internal server error occurred",
    code: "SERVER_ERROR",
    status: 500
  },
  ENCRYPTION_ERROR: {
    error: "An encryption error occurred",
    code: "ENCRYPTION_ERROR",
    status: 500
  }
};

/**
 * Create a standardized error response
 *
 * @param errorType Type of error from ERROR_RESPONSES
 * @param details Optional additional details (safe to expose)
 * @param headers Optional additional headers
 * @returns NextResponse with error details
 */
function createErrorResponse(
  errorType: keyof typeof ERROR_RESPONSES,
  details?: Record<string, any>,
  headers?: Record<string, string>
): NextResponse {
  const errorTemplate = ERROR_RESPONSES[errorType];

  const responseBody = {
    error: errorTemplate.error,
    code: errorTemplate.code,
    ...(details ? { details } : {})
  };

  const responseHeaders = {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
    'X-Content-Type-Options': 'nosniff',
    ...headers
  };

  // Add Retry-After header for rate limiting
  if (errorType === 'RATE_LIMITED' && !headers?.['Retry-After']) {
    responseHeaders['Retry-After'] = '60'; // Default 60 seconds
  }

  return NextResponse.json(responseBody, {
    status: errorTemplate.status,
    headers: responseHeaders
  });
}

// Send an encrypted message to a group
export async function POST(request: NextRequest) {
  return withNextAuth(request, async (req, userId) => {
    try {
      // Apply rate limiting
      try {
        await messageSendLimiter.check(userId, 30);
      } catch (error) {
        return createErrorResponse('RATE_LIMITED', {
          message: "Too many messages sent. Please try again later."
        }, {
          'Retry-After': '60' // Try again after 60 seconds
        });
      }

      // Parse and validate request body
      let body;
      try {
        body = await req.json();
      } catch (error) {
        return createErrorResponse('VALIDATION_FAILED', {
          message: "Invalid JSON in request body"
        });
      }

      const validationResult = sendMessageSchema.safeParse(body);

      if (!validationResult.success) {
        return createErrorResponse('VALIDATION_FAILED', {
          validation: validationResult.error.format()
        });
      }

      const { groupId, content, iv: clientIv, isE2EE, messageNonce } = validationResult.data;

      // Check for message replay if nonce is provided
      if (messageNonce) {
        let userNonces = recentNonces.get(userId);
        if (!userNonces) {
          userNonces = new Set();
          recentNonces.set(userId, userNonces);
        }

        if (userNonces.has(messageNonce)) {
          return createErrorResponse('VALIDATION_FAILED', {
            message: "Message appears to be a duplicate",
            code: "DUPLICATE_NONCE"
          });
        }

        // Store nonce to prevent replay
        userNonces.add(messageNonce);

        // Set expiry for this nonce
        setTimeout(() => {
          const nonces = recentNonces.get(userId);
          if (nonces) {
            nonces.delete(messageNonce);
          }
        }, 5 * 60 * 1000); // Expire after 5 minutes
      }

      // Check if user is a member of the group
      const membership = await prisma.groupMember.findUnique({
        where: {
          userId_groupId: {
            userId,
            groupId,
          },
        },
      });

      if (!membership) {
        return createErrorResponse('FORBIDDEN', {
          message: "You are not a member of this group"
        });
      }

      let encryptedContent: string;
      let iv: string;

      if (isE2EE) {
        // For E2EE messages, the content is already encrypted by the client
        // We just store it as is

        // Validate that client provided an IV for E2EE
        if (!clientIv) {
          return createErrorResponse('VALIDATION_FAILED', {
            message: "IV is required for end-to-end encrypted messages"
          });
        }

        // Additional validation for E2EE content format
        if (!/^[0-9a-fA-F]+$/.test(content)) {
          return createErrorResponse('VALIDATION_FAILED', {
            message: "Invalid encrypted content format",
            code: "INVALID_E2EE_FORMAT"
          });
        }

        encryptedContent = content;
        iv = clientIv;
      } else {
        // For normal messages, encrypt on the server
        try {
          // Get the group's encryption key
          const encryptionKey = await prisma.encryptionKey.findFirst({
            where: {
              groupId,
              isRevoked: false,
            },
            orderBy: {
              createdAt: "desc",
            },
          });

          if (!encryptionKey) {
            return createErrorResponse('ENCRYPTION_ERROR', {
              message: "No valid encryption key found for this group"
            });
          }

          // Sanitize content to prevent XSS
          const sanitizedContent = content
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');

          // Encrypt the message content
          const encrypted = aesEncrypt(sanitizedContent, encryptionKey.keyValue);
          encryptedContent = encrypted.encryptedData;
          iv = encrypted.iv;
        } catch (error) {
          console.error("Encryption error:", error);
          return createErrorResponse('ENCRYPTION_ERROR');
        }
      }

      // Store the encrypted message
      const message = await prisma.message.create({
        data: {
          senderId: userId,
          groupId,
          encryptedContent,
          iv,
          metaData: isE2EE
            ? JSON.stringify({
                isE2EE: true,
                // Store message hash/fingerprint for integrity verification
                nonce: messageNonce || undefined
              })
            : null,
          // Mark as read by the sender
          readBy: {
            create: {
              userId,
            },
          },
        },
        include: {
          sender: {
            select: {
              username: true,
            },
          },
        },
      });

      // Log message creation for security audit (but not the content)
      await prisma.userSecurityLog.create({
        data: {
          userId,
          action: "MESSAGE_SENT",
          details: `Message sent to group ${groupId}`,
          ipAddress: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown",
          userAgent: req.headers.get("user-agent") || "unknown",
          success: true,
        },
      });

      // Broadcast the message to all connected clients in the group
      broadcastToGroup(groupId, {
        type: 'new_message',
        messageId: message.id,
        groupId: message.groupId,
        senderId: message.senderId,
        senderUsername: message.sender.username,
        encryptedContent: message.encryptedContent,
        iv: message.iv,
        createdAt: message.createdAt,
        isE2EE,
        nonce: messageNonce || undefined,
      });

      // Return the message ID
      return NextResponse.json({
        id: message.id,
        sentAt: message.createdAt,
      }, {
        status: 201,
        headers: {
          // Add security headers to all responses
          'Content-Security-Policy': "default-src 'self'; script-src 'self'",
          'X-Content-Type-Options': 'nosniff',
          'Cache-Control': 'no-store, private'
        }
      });
    } catch (error) {
      console.error("Error sending message:", error);

      // Log failed attempt
      try {
        await prisma.userSecurityLog.create({
          data: {
            userId,
            action: "MESSAGE_SEND_FAILED",
            details: `Failed to send message: ${error instanceof Error ? error.message : 'Unknown error'}`,
            ipAddress: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown",
            userAgent: req.headers.get("user-agent") || "unknown",
            success: false,
          },
        });
      } catch (logError) {
        // Don't fail if logging fails
        console.error("Failed to log message error:", logError);
      }

      return createErrorResponse('SERVER_ERROR');
    }
  });
}

// Rate limit configuration for message fetching
// 60 requests per minute
const messageFetchLimiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500, // Max number of users per interval
  limit: 60, // 60 requests per interval
});

// Get messages for a group with pagination
export async function GET(request: NextRequest) {
  return withNextAuth(request, async (req, userId) => {
    try {
      // Apply rate limiting
      try {
        await messageFetchLimiter.check(userId, 60);
      } catch (error) {
        return createErrorResponse('RATE_LIMITED', {
          message: "Too many requests. Please try again later."
        }, {
          'Retry-After': '60' // Try again after 60 seconds
        });
      }

      // Get and validate query parameters
      const { searchParams } = new URL(req.url);

      const groupId = searchParams.get("groupId");
      if (!groupId) {
        return createErrorResponse('VALIDATION_FAILED', {
          message: "Group ID is required"
        });
      }

      const limit = parseInt(searchParams.get("limit") || "50", 10);
      const cursor = searchParams.get("cursor");

      const validationResult = listMessagesSchema.safeParse({
        groupId,
        limit,
        cursor,
      });

      if (!validationResult.success) {
        return createErrorResponse('VALIDATION_FAILED', {
          validation: validationResult.error.format()
        });
      }

      // Check if user is a member of the group
      const membership = await prisma.groupMember.findUnique({
        where: {
          userId_groupId: {
            userId,
            groupId,
          },
        },
      });

      if (!membership) {
        return createErrorResponse('FORBIDDEN', {
          message: "You are not a member of this group"
        });
      }

      // Fetch messages with pagination, but prevent excessive data retrieval
      const messages = await prisma.message.findMany({
        where: {
          groupId,
        },
        take: Math.min(limit, 100), // Set a hard max of 100 messages per request
        ...(cursor
          ? {
              skip: 1, // Skip the cursor
              cursor: {
                id: cursor,
              },
            }
          : {}),
        orderBy: {
          createdAt: "desc",
        },
        include: {
          sender: {
            select: {
              id: true,
              username: true,
            },
          },
          readBy: {
            select: {
              userId: true,
              readAt: true,
            },
          },
        },
      });

      // Mark messages as read by the current user
      const unreadMessageIds = messages
        .filter(
          (message) => !message.readBy.some((read) => read.userId === userId)
        )
        .map((message) => message.id);

      if (unreadMessageIds.length > 0) {
        await prisma.$transaction(
          unreadMessageIds.map((messageId) =>
            prisma.messageRead.create({
              data: {
                messageId,
                userId,
              },
            })
          )
        );
      }

      // Transform the messages
      const sanitizedMessages = messages.map((message) => {
        // Check if message is E2EE
        const metaData = message.metaData ? JSON.parse(message.metaData) : {};
        const isE2EE = metaData.isE2EE === true;
        const nonce = metaData.nonce;

        // For E2EE messages, we just pass through the encrypted content
        // For server-encrypted messages, we would normally decrypt, but we'll pass through for consistency
        return {
          id: message.id,
          senderId: message.senderId,
          senderUsername: message.sender.username,
          encryptedContent: message.encryptedContent,
          iv: message.iv,
          createdAt: message.createdAt,
          updatedAt: message.updatedAt,
          isE2EE,
          nonce,
          readBy: message.readBy.map((read) => ({
            userId: read.userId,
            readAt: read.readAt,
          })),
        };
      });

      // Get the next cursor
      const nextCursor = messages.length > 0 ? messages[messages.length - 1].id : null;

      return NextResponse.json({
        messages: sanitizedMessages,
        nextCursor,
        hasMore: messages.length === Math.min(limit, 100), // Check if we reached the limit
      }, {
        headers: {
          // Add security headers to all responses
          'Content-Security-Policy': "default-src 'self'; script-src 'self'",
          'X-Content-Type-Options': 'nosniff',
          // Cache control to prevent storing sensitive data in browser
          'Cache-Control': 'private, no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        }
      });
    } catch (error) {
      console.error("Error fetching messages:", error);

      // Log error
      try {
        await prisma.userSecurityLog.create({
          data: {
            userId,
            action: "MESSAGE_FETCH_FAILED",
            details: `Failed to fetch messages: ${error instanceof Error ? error.message : 'Unknown error'}`,
            ipAddress: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown",
            userAgent: req.headers.get("user-agent") || "unknown",
            success: false,
          },
        });
      } catch (logError) {
        console.error("Failed to log fetch error:", logError);
      }

      return createErrorResponse('SERVER_ERROR');
    }
  });
}
