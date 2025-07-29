import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { withNextAuth } from "@/lib/auth/middleware";
import { aesEncrypt } from "@/lib/encryption/crypto";
import { getCurrentKey } from "@/lib/encryption/keyManager";

// Validation schema for creating a post
const createPostSchema = z.object({
  title: z.string().min(1, "Post title is required").max(200),
  content: z.string().min(1, "Post content is required").max(100000),
});

// Validation schema for listing posts
const listPostsSchema = z.object({
  limit: z.number().int().min(1).max(50).optional().default(20),
  cursor: z.string().optional(),
  isPinned: z.boolean().optional(),
});

// Get all posts for a discussion board
export async function GET(
  request: NextRequest,
  { params }: { params: { boardId: string } }
) {
  return withNextAuth(request, async (req, userId) => {
    try {
      const { boardId } = params;
      const { searchParams } = new URL(req.url);

      const limit = parseInt(searchParams.get("limit") || "20", 10);
      const cursor = searchParams.get("cursor");
      const isPinned = searchParams.get("isPinned") === "true" ? true : undefined;

      const validationResult = listPostsSchema.safeParse({
        limit,
        cursor,
        isPinned,
      });

      if (!validationResult.success) {
        return NextResponse.json(
          { error: "Validation failed", details: validationResult.error.format() },
          { status: 400 }
        );
      }

      // Get the board to check permissions and get the groupId
      const board = await prisma.discussionBoard.findUnique({
        where: { id: boardId },
        select: { groupId: true, isArchived: true },
      });

      if (!board) {
        return NextResponse.json(
          { error: "Discussion board not found" },
          { status: 404 }
        );
      }

      if (board.isArchived) {
        return NextResponse.json(
          { error: "This discussion board is archived" },
          { status: 403 }
        );
      }

      // Check if user is a member of the group
      const membership = await prisma.groupMember.findUnique({
        where: {
          userId_groupId: {
            userId,
            groupId: board.groupId,
          },
        },
      });

      if (!membership) {
        return NextResponse.json(
          { error: "You do not have access to this group" },
          { status: 403 }
        );
      }

      // Fetch posts with pagination
      const posts = await prisma.discussionPost.findMany({
        where: {
          boardId,
          isPinned,
        },
        take: limit,
        ...(cursor
          ? {
              skip: 1, // Skip the cursor
              cursor: {
                id: cursor,
              },
            }
          : {}),
        orderBy: [
          { isPinned: "desc" }, // Pinned posts first
          { createdAt: "desc" }, // Then newest first
        ],
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
              comments: true,
              reactions: true,
            },
          },
        },
      });

      // Get encryption key for this group to decrypt posts if needed
      const { keyValue } = await getCurrentKey("AES", board.groupId);

      // The posts are returned with encrypted content
      // In a real app, you would decrypt this on the client side

      // Get the next cursor
      const nextCursor = posts.length > 0 ? posts[posts.length - 1].id : null;

      return NextResponse.json({
        posts,
        nextCursor,
        hasMore: posts.length === limit,
      });
    } catch (error) {
      console.error("Error fetching discussion posts:", error);
      return NextResponse.json(
        { error: "Failed to fetch discussion posts" },
        { status: 500 }
      );
    }
  });
}

// Create a new post in a discussion board
export async function POST(
  request: NextRequest,
  { params }: { params: { boardId: string } }
) {
  return withNextAuth(request, async (req, userId) => {
    try {
      const { boardId } = params;

      // Parse and validate request body
      const body = await req.json();
      const validationResult = createPostSchema.safeParse(body);

      if (!validationResult.success) {
        return NextResponse.json(
          { error: "Validation failed", details: validationResult.error.format() },
          { status: 400 }
        );
      }

      const { title, content } = validationResult.data;

      // Get the board to check permissions and get the groupId
      const board = await prisma.discussionBoard.findUnique({
        where: { id: boardId },
        select: { groupId: true, isArchived: true },
      });

      if (!board) {
        return NextResponse.json(
          { error: "Discussion board not found" },
          { status: 404 }
        );
      }

      if (board.isArchived) {
        return NextResponse.json(
          { error: "Cannot create post in an archived board" },
          { status: 403 }
        );
      }

      // Check if user is a member of the group
      const membership = await prisma.groupMember.findUnique({
        where: {
          userId_groupId: {
            userId,
            groupId: board.groupId,
          },
        },
      });

      if (!membership) {
        return NextResponse.json(
          { error: "You do not have access to this group" },
          { status: 403 }
        );
      }

      // Get the group's encryption key
      const { keyValue, keyId } = await getCurrentKey("AES", board.groupId);

      // Encrypt the post content
      const { encryptedData, iv } = aesEncrypt(content, keyValue);

      // Create the post
      const post = await prisma.discussionPost.create({
        data: {
          title,
          encryptedContent: encryptedData,
          iv,
          keyId,
          authorId: userId,
          boardId,
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
          action: "DISCUSSION_POST_CREATE",
          success: true,
          details: `Created post ${post.id} in board ${boardId}`,
          ipAddress: req.headers.get("x-forwarded-for") || "unknown",
          userAgent: req.headers.get("user-agent") || "unknown",
        },
      });

      return NextResponse.json(post, { status: 201 });
    } catch (error) {
      console.error("Error creating discussion post:", error);
      return NextResponse.json(
        { error: "Failed to create discussion post" },
        { status: 500 }
      );
    }
  });
}
