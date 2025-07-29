import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { withNextAuth } from "@/lib/auth/middleware";
import { aesDecrypt, aesEncrypt } from "@/lib/encryption/aes";
import { getCurrentKey } from "@/lib/encryption/keyManager";
import { randomBytes } from "crypto";
import { logActivity } from "@/lib/activity/logger";

// Validation schema for fetching replies
const getRepliesSchema = z.object({
  parentId: z.string().uuid(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(10),
});

// Validation schema for creating a reply
const createReplySchema = z.object({
  parentId: z.string().uuid(),
  content: z.string().min(1).max(2000),
});

// Validation schema for deleting a reply
const deleteReplySchema = z.object({
  replyId: z.string().uuid(),
});

// Get replies for a specific comment
export async function GET(request: NextRequest) {
  return withNextAuth(request, async (req, userId) => {
    try {
      // Extract and validate query parameters
      const { searchParams } = new URL(req.url);
      const parentId = searchParams.get("parentId");
      const page = searchParams.get("page") || "1";
      const limit = searchParams.get("limit") || "10";

      const validationResult = getRepliesSchema.safeParse({
        parentId,
        page: parseInt(page),
        limit: parseInt(limit),
      });

      if (!validationResult.success) {
        return NextResponse.json(
          { error: "Validation failed", details: validationResult.error.format() },
          { status: 400 }
        );
      }

      const { parentId: validatedParentId, page: validatedPage, limit: validatedLimit } = validationResult.data;

      // Check if the parent comment exists
      const parentComment = await prisma.comment.findUnique({
        where: { id: validatedParentId },
        include: {
          post: {
            select: {
              board: {
                select: {
                  groupId: true,
                },
              },
            },
          },
          file: {
            select: {
              groupId: true,
              uploaderId: true,
            },
          },
        },
      });

      if (!parentComment) {
        return NextResponse.json(
          { error: "Parent comment not found" },
          { status: 404 }
        );
      }

      // Check permission to access the comment
      let groupId: string | null = null;

      if (parentComment.post) {
        groupId = parentComment.post.board.groupId;
      } else if (parentComment.file) {
        // For file comments
        if (!parentComment.file.groupId && parentComment.file.uploaderId !== userId) {
          return NextResponse.json(
            { error: "You do not have access to this comment" },
            { status: 403 }
          );
        }
        groupId = parentComment.file.groupId;
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
            { error: "You do not have access to this comment" },
            { status: 403 }
          );
        }
      }

      // Calculate pagination
      const skip = (validatedPage - 1) * validatedLimit;

      // Fetch replies for the comment
      const replies = await prisma.comment.findMany({
        where: {
          parentId: validatedParentId,
          isDeleted: false
        },
        orderBy: { createdAt: "asc" },
        skip,
        take: validatedLimit,
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
              children: true,
              reactions: true,
            },
          },
        },
      });

      // Decrypt the encrypted content
      const currentKey = await getCurrentKey();
      const decryptedReplies = await Promise.all(
        replies.map(async (reply) => {
          try {
            const decryptedContent = await aesDecrypt(
              reply.content,
              currentKey.keyValue,
              reply.iv || undefined
            );

            // Don't expose the IV to the client
            const { iv, ...replyWithoutIv } = reply;

            return {
              ...replyWithoutIv,
              content: decryptedContent,
              hasReplies: reply._count.children > 0,
              reactionCount: reply._count.reactions,
            };
          } catch (error) {
            console.error(`Failed to decrypt reply ${reply.id}:`, error);
            return {
              ...reply,
              iv: undefined,
              content: "[Encrypted content - unable to decrypt]",
              hasReplies: reply._count.children > 0,
              reactionCount: reply._count.reactions,
            };
          }
        })
      );

      // Get total count for pagination
      const totalReplies = await prisma.comment.count({
        where: {
          parentId: validatedParentId,
          isDeleted: false,
        },
      });

      return NextResponse.json({
        replies: decryptedReplies,
        pagination: {
          page: validatedPage,
          limit: validatedLimit,
          totalItems: totalReplies,
          totalPages: Math.ceil(totalReplies / validatedLimit),
          hasMore: validatedPage * validatedLimit < totalReplies,
        },
      });
    } catch (error) {
      console.error("Error fetching replies:", error);
      return NextResponse.json(
        { error: "Failed to fetch replies" },
        { status: 500 }
      );
    }
  });
}

// Create a new reply to a comment
export async function POST(request: NextRequest) {
  return withNextAuth(request, async (req, userId) => {
    try {
      const body = await req.json();

      const validationResult = createReplySchema.safeParse(body);

      if (!validationResult.success) {
        return NextResponse.json(
          { error: "Validation failed", details: validationResult.error.format() },
          { status: 400 }
        );
      }

      const { parentId, content } = validationResult.data;

      // Check if parent comment exists
      const parentComment = await prisma.comment.findUnique({
        where: { id: parentId },
        include: {
          post: {
            select: {
              id: true,
              board: {
                select: {
                  id: true,
                  groupId: true,
                },
              },
            },
          },
          file: {
            select: {
              id: true,
              name: true,
              groupId: true,
              uploaderId: true,
            },
          },
        },
      });

      if (!parentComment) {
        return NextResponse.json(
          { error: "Parent comment not found" },
          { status: 404 }
        );
      }

      // Check permissions based on whether this is a post comment or file comment
      let groupId: string | null = null;
      let resourceType: "post" | "file" = "post";
      let resourceId: string;
      let boardId: string | null = null;

      if (parentComment.post) {
        groupId = parentComment.post.board.groupId;
        resourceId = parentComment.post.id;
        boardId = parentComment.post.board.id;
      } else if (parentComment.file) {
        resourceType = "file";
        resourceId = parentComment.file.id;

        // For file comments, check specific permissions
        if (!parentComment.file.groupId && parentComment.file.uploaderId !== userId) {
          return NextResponse.json(
            { error: "You do not have permission to reply to this comment" },
            { status: 403 }
          );
        }
        groupId = parentComment.file.groupId;
      } else {
        return NextResponse.json(
          { error: "Invalid comment type" },
          { status: 400 }
        );
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
            { error: "You do not have permission to reply to this comment" },
            { status: 403 }
          );
        }
      }

      // Encrypt the reply content
      const currentKey = await getCurrentKey();
      const iv = randomBytes(16).toString("hex");
      const encryptedContent = await aesEncrypt(content, currentKey.keyValue, iv);

      // Create the reply
      const reply = await prisma.comment.create({
        data: {
          content: encryptedContent,
          iv,
          authorId: userId,
          parentId,
          postId: resourceType === "post" ? resourceId : null,
          fileId: resourceType === "file" ? resourceId : null,
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

      // Log the activity
      await logActivity({
        userId,
        action: "COMMENT_REPLY_CREATED",
        resourceId: reply.id,
        resourceType: "COMMENT",
        groupId,
        boardId,
        metadata: {
          parentCommentId: parentId,
          relatedResourceType: resourceType,
          relatedResourceId: resourceId,
        },
      });

      // Return the newly created reply (decrypted for immediate display)
      const { iv: replyIv, ...replyWithoutIv } = reply;

      return NextResponse.json({
        reply: {
          ...replyWithoutIv,
          content, // Return the original content instead of encrypted content
          hasReplies: false,
          reactionCount: 0,
        },
      });
    } catch (error) {
      console.error("Error creating reply:", error);
      return NextResponse.json(
        { error: "Failed to create reply" },
        { status: 500 }
      );
    }
  });
}

// Delete a reply
export async function DELETE(request: NextRequest) {
  return withNextAuth(request, async (req, userId) => {
    try {
      const body = await req.json();

      const validationResult = deleteReplySchema.safeParse(body);

      if (!validationResult.success) {
        return NextResponse.json(
          { error: "Validation failed", details: validationResult.error.format() },
          { status: 400 }
        );
      }

      const { replyId } = validationResult.data;

      // Find the reply
      const reply = await prisma.comment.findUnique({
        where: { id: replyId },
        include: {
          post: {
            select: {
              board: {
                select: {
                  id: true,
                  groupId: true,
                },
              },
            },
          },
          file: {
            select: {
              groupId: true,
            },
          },
        },
      });

      if (!reply) {
        return NextResponse.json(
          { error: "Reply not found" },
          { status: 404 }
        );
      }

      // Check if user is the author or has permission to delete
      if (reply.authorId !== userId) {
        // Check if user is a moderator or admin in the group
        let groupId: string | null = null;
        let boardId: string | null = null;

        if (reply.post) {
          groupId = reply.post.board.groupId;
          boardId = reply.post.board.id;
        } else if (reply.file) {
          groupId = reply.file.groupId;
        }

        if (groupId) {
          const membership = await prisma.groupMember.findUnique({
            where: {
              userId_groupId: {
                userId,
                groupId,
              },
            },
          });

          if (!membership || (membership.role !== "ADMIN" && membership.role !== "MODERATOR")) {
            return NextResponse.json(
              { error: "You do not have permission to delete this reply" },
              { status: 403 }
            );
          }
        } else {
          return NextResponse.json(
            { error: "You do not have permission to delete this reply" },
            { status: 403 }
          );
        }
      }

      // Mark the reply as deleted (soft delete)
      await prisma.comment.update({
        where: { id: replyId },
        data: { isDeleted: true },
      });

      // Log the activity
      let resourceType: "post" | "file" = "post";
      let resourceId: string | null = null;
      let groupId: string | null = null;
      let boardId: string | null = null;

      if (reply.post) {
        resourceType = "post";
        resourceId = reply.postId;
        groupId = reply.post.board.groupId;
        boardId = reply.post.board.id;
      } else if (reply.file) {
        resourceType = "file";
        resourceId = reply.fileId;
        groupId = reply.file.groupId;
      }

      await logActivity({
        userId,
        action: "COMMENT_REPLY_DELETED",
        resourceId: replyId,
        resourceType: "COMMENT",
        groupId,
        boardId,
        metadata: {
          parentCommentId: reply.parentId,
          relatedResourceType: resourceType,
          relatedResourceId: resourceId,
        },
      });

      return NextResponse.json({ success: true });
    } catch (error) {
      console.error("Error deleting reply:", error);
      return NextResponse.json(
        { error: "Failed to delete reply" },
        { status: 500 }
      );
    }
  });
}
