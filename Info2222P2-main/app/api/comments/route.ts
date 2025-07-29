import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { withNextAuth } from "@/lib/auth/middleware";
import { aesEncrypt } from "@/lib/encryption/crypto";
import { getCurrentKey } from "@/lib/encryption/keyManager";

// Validation schema for creating a comment
const createCommentSchema = z.object({
  content: z.string().min(1, "Comment content is required").max(5000),
  // Only one of these should be provided
  postId: z.string().uuid("Invalid post ID").optional(),
  fileId: z.string().uuid("Invalid file ID").optional(),
  parentId: z.string().uuid("Invalid parent comment ID").optional(),
}).refine(
  (data) => {
    // Ensure at least one content ID is provided
    return Boolean(data.postId || data.fileId || data.parentId);
  },
  {
    message: "At least one of postId, fileId, or parentId must be provided",
    path: ["contentReference"],
  }
);

// Validation schema for listing comments
const listCommentsSchema = z.object({
  postId: z.string().uuid("Invalid post ID").optional(),
  fileId: z.string().uuid("Invalid file ID").optional(),
  parentId: z.string().uuid("Invalid parent comment ID").optional(),
  limit: z.number().int().min(1).max(100).optional().default(50),
  cursor: z.string().optional(),
}).refine(
  (data) => {
    // Ensure exactly one content ID is provided
    const providedIds = [
      data.postId,
      data.fileId,
      data.parentId
    ].filter(Boolean);

    return providedIds.length === 1;
  },
  {
    message: "Exactly one of postId, fileId, or parentId must be provided",
    path: ["contentReference"],
  }
);

// Get comments for a specific content item or parent comment
export async function GET(request: NextRequest) {
  return withNextAuth(request, async (req, userId) => {
    try {
      // Get and validate query parameters
      const { searchParams } = new URL(req.url);

      const postId = searchParams.get("postId");
      const fileId = searchParams.get("fileId");
      const parentId = searchParams.get("parentId");
      const limit = parseInt(searchParams.get("limit") || "50", 10);
      const cursor = searchParams.get("cursor");

      const validationResult = listCommentsSchema.safeParse({
        postId,
        fileId,
        parentId,
        limit,
        cursor,
      });

      if (!validationResult.success) {
        return NextResponse.json(
          { error: "Validation failed", details: validationResult.error.format() },
          { status: 400 }
        );
      }

      // Check permissions based on what the comments are attached to
      let groupId: string | null = null;

      if (postId) {
        // Check if user has access to the post
        const post = await prisma.discussionPost.findUnique({
          where: { id: postId },
          select: { board: { select: { groupId: true } } },
        });

        if (!post) {
          return NextResponse.json(
            { error: "Post not found" },
            { status: 404 }
          );
        }

        groupId = post.board.groupId;
      } else if (fileId) {
        // Check if user has access to the file
        const file = await prisma.file.findUnique({
          where: { id: fileId },
          select: { groupId: true, uploaderId: true },
        });

        if (!file) {
          return NextResponse.json(
            { error: "File not found" },
            { status: 404 }
          );
        }

        // If it's a private file, only the uploader can access it
        if (!file.groupId && file.uploaderId !== userId) {
          return NextResponse.json(
            { error: "You do not have access to this content" },
            { status: 403 }
          );
        }

        groupId = file.groupId;
      } else if (parentId) {
        // For parent comment, we need to check what it's attached to
        const comment = await prisma.comment.findUnique({
          where: { id: parentId },
          select: {
            postId: true,
            post: { select: { board: { select: { groupId: true } } } },
            fileId: true,
            file: { select: { groupId: true, uploaderId: true } },
          },
        });

        if (!comment) {
          return NextResponse.json(
            { error: "Parent comment not found" },
            { status: 404 }
          );
        }

        // Get group ID from either post or file
        if (comment.postId) {
          groupId = comment.post?.board.groupId || null;
        } else if (comment.fileId) {
          const file = comment.file;

          // If it's a private file, only the uploader can access it
          if (!file?.groupId && file?.uploaderId !== userId) {
            return NextResponse.json(
              { error: "You do not have access to this content" },
              { status: 403 }
            );
          }

          groupId = file?.groupId || null;
        }
      }

      // If this is group content, check membership
      if (groupId) {
        const membership = await prisma.groupMember.findUnique({
          where: {
            userId_groupId: {
              userId,
              groupId,
            },
          },
        });

        if (!membership) {
          return NextResponse.json(
            { error: "You do not have access to this content" },
            { status: 403 }
          );
        }
      }

      // Build the where condition
      const where: any = {};

      if (postId) {
        where.postId = postId;
        where.parentId = null; // Top-level comments only for posts
      } else if (fileId) {
        where.fileId = fileId;
        where.parentId = null; // Top-level comments only for files
      } else if (parentId) {
        where.parentId = parentId; // Replies to a specific comment
      }

      // Fetch comments with pagination
      const comments = await prisma.comment.findMany({
        where,
        take: limit,
        ...(cursor
          ? {
              skip: 1, // Skip the cursor
              cursor: {
                id: cursor,
              },
            }
          : {}),
        orderBy: {
          createdAt: "asc", // Oldest first (chronological order)
        },
        include: {
          author: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
            },
          },
          _count: {
            select: {
              reactions: true,
              replies: true,
            },
          },
        },
      });

      // Get the encryption key for the group (if needed)
      // This is just a reference - in real implementation, the decryption would happen client-side
      const encryptionKey = groupId ? await getCurrentKey("AES", groupId) : null;

      // Get the next cursor
      const nextCursor = comments.length > 0 ? comments[comments.length - 1].id : null;

      return NextResponse.json({
        comments,
        nextCursor,
        hasMore: comments.length === limit,
      });
    } catch (error) {
      console.error("Error fetching comments:", error);
      return NextResponse.json(
        { error: "Failed to fetch comments" },
        { status: 500 }
      );
    }
  });
}

// Create a new comment
export async function POST(request: NextRequest) {
  return withNextAuth(request, async (req, userId) => {
    try {
      // Parse and validate request body
      const body = await req.json();
      const validationResult = createCommentSchema.safeParse(body);

      if (!validationResult.success) {
        return NextResponse.json(
          { error: "Validation failed", details: validationResult.error.format() },
          { status: 400 }
        );
      }

      const { content, postId, fileId, parentId } = validationResult.data;

      // Get the group ID based on what the comment is attached to
      let groupId: string | null = null;

      if (postId) {
        // Check if user has access to the post
        const post = await prisma.discussionPost.findUnique({
          where: { id: postId },
          select: { board: { select: { groupId: true } } },
        });

        if (!post) {
          return NextResponse.json(
            { error: "Post not found" },
            { status: 404 }
          );
        }

        groupId = post.board.groupId;
      } else if (fileId) {
        // Check if user has access to the file
        const file = await prisma.file.findUnique({
          where: { id: fileId },
          select: { groupId: true, uploaderId: true },
        });

        if (!file) {
          return NextResponse.json(
            { error: "File not found" },
            { status: 404 }
          );
        }

        // If it's a private file, only the uploader can access it
        if (!file.groupId && file.uploaderId !== userId) {
          return NextResponse.json(
            { error: "You do not have access to this content" },
            { status: 403 }
          );
        }

        groupId = file.groupId;
      } else if (parentId) {
        // For parent comment, we need to check what it's attached to
        const comment = await prisma.comment.findUnique({
          where: { id: parentId },
          select: {
            postId: true,
            post: { select: { board: { select: { groupId: true } } } },
            fileId: true,
            file: { select: { groupId: true, uploaderId: true } },
          },
        });

        if (!comment) {
          return NextResponse.json(
            { error: "Parent comment not found" },
            { status: 404 }
          );
        }

        // Get group ID from either post or file
        if (comment.postId) {
          groupId = comment.post?.board.groupId || null;
        } else if (comment.fileId) {
          const file = comment.file;

          // If it's a private file, only the uploader can access it
          if (!file?.groupId && file?.uploaderId !== userId) {
            return NextResponse.json(
              { error: "You do not have access to this content" },
              { status: 403 }
            );
          }

          groupId = file?.groupId || null;
        }
      }

      // If this is group content, check membership
      if (groupId) {
        const membership = await prisma.groupMember.findUnique({
          where: {
            userId_groupId: {
              userId,
              groupId,
            },
          },
        });

        if (!membership) {
          return NextResponse.json(
            { error: "You do not have access to this content" },
            { status: 403 }
          );
        }
      }

      // Get the encryption key for the group (if there is one)
      let encryptedContent;
      let iv;
      let keyId;

      if (groupId) {
        const { keyValue, keyId: groupKeyId } = await getCurrentKey("AES", groupId);
        keyId = groupKeyId;

        // Encrypt the comment content
        const result = aesEncrypt(content, keyValue);
        encryptedContent = result.encryptedData;
        iv = result.iv;
      } else {
        // For private files or other non-group content, we could either store unencrypted
        // or encrypt with a user-specific key. For this implementation, we'll use a simple approach.
        const result = aesEncrypt(content, process.env.DEFAULT_ENCRYPTION_KEY || "fallback-key");
        encryptedContent = result.encryptedData;
        iv = result.iv;
      }

      // Create the comment
      const comment = await prisma.comment.create({
        data: {
          encryptedContent,
          iv,
          keyId,
          authorId: userId,
          postId,
          fileId,
          parentId,
        },
        include: {
          author: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
            },
          },
        },
      });

      // Log the action
      await prisma.userSecurityLog.create({
        data: {
          userId,
          action: "COMMENT_CREATE",
          success: true,
          details: `Created comment ${comment.id} ${
            postId ? `on post ${postId}` : fileId ? `on file ${fileId}` : `as reply to ${parentId}`
          }`,
          ipAddress: req.headers.get("x-forwarded-for") || "unknown",
          userAgent: req.headers.get("user-agent") || "unknown",
        },
      });

      return NextResponse.json(comment, { status: 201 });
    } catch (error) {
      console.error("Error creating comment:", error);
      return NextResponse.json(
        { error: "Failed to create comment" },
        { status: 500 }
      );
    }
  });
}
