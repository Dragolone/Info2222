import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { withNextAuth } from "@/lib/auth/middleware";
import { aesEncrypt } from "@/lib/encryption/crypto";
import { getCurrentKey } from "@/lib/encryption/keyManager";

// Validation schema for updating a comment
const updateCommentSchema = z.object({
  content: z.string().min(1, "Comment content is required").max(5000),
});

// Get a specific comment by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { commentId: string } }
) {
  return withNextAuth(request, async (req, userId) => {
    try {
      const { commentId } = params;

      // Find the comment with author info
      const comment = await prisma.comment.findUnique({
        where: { id: commentId },
        include: {
          author: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
            },
          },
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
          _count: {
            select: {
              reactions: true,
              replies: true,
            },
          },
        },
      });

      if (!comment) {
        return NextResponse.json(
          { error: "Comment not found" },
          { status: 404 }
        );
      }

      // Check permission to access the comment
      let groupId: string | null = null;

      if (comment.post) {
        groupId = comment.post.board.groupId;
      } else if (comment.file) {
        // For file comments
        if (!comment.file.groupId && comment.file.uploaderId !== userId) {
          return NextResponse.json(
            { error: "You do not have access to this comment" },
            { status: 403 }
          );
        }
        groupId = comment.file.groupId;
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

      // Return the comment
      return NextResponse.json(comment);
    } catch (error) {
      console.error("Error fetching comment:", error);
      return NextResponse.json(
        { error: "Failed to fetch comment" },
        { status: 500 }
      );
    }
  });
}

// Update a specific comment
export async function PATCH(
  request: NextRequest,
  { params }: { params: { commentId: string } }
) {
  return withNextAuth(request, async (req, userId) => {
    try {
      const { commentId } = params;

      // Parse and validate request body
      const body = await req.json();
      const validationResult = updateCommentSchema.safeParse(body);

      if (!validationResult.success) {
        return NextResponse.json(
          { error: "Validation failed", details: validationResult.error.format() },
          { status: 400 }
        );
      }

      const { content } = validationResult.data;

      // Find the comment to verify ownership and get necessary information
      const comment = await prisma.comment.findUnique({
        where: { id: commentId },
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
            },
          },
        },
      });

      if (!comment) {
        return NextResponse.json(
          { error: "Comment not found" },
          { status: 404 }
        );
      }

      // Verify the user is the author of the comment
      if (comment.authorId !== userId) {
        return NextResponse.json(
          { error: "You are not authorized to update this comment" },
          { status: 403 }
        );
      }

      // Get the group ID for encryption
      let groupId: string | null = null;

      if (comment.post) {
        groupId = comment.post.board.groupId;
      } else if (comment.file) {
        groupId = comment.file.groupId;
      }

      // Encrypt the updated content
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
        // For private files or other non-group content
        const result = aesEncrypt(content, process.env.DEFAULT_ENCRYPTION_KEY || "fallback-key");
        encryptedContent = result.encryptedData;
        iv = result.iv;
      }

      // Update the comment
      const updatedComment = await prisma.comment.update({
        where: { id: commentId },
        data: {
          encryptedContent,
          iv,
          keyId,
          updatedAt: new Date(),
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
          action: "COMMENT_UPDATE",
          success: true,
          details: `Updated comment ${commentId}`,
          ipAddress: req.headers.get("x-forwarded-for") || "unknown",
          userAgent: req.headers.get("user-agent") || "unknown",
        },
      });

      return NextResponse.json(updatedComment);
    } catch (error) {
      console.error("Error updating comment:", error);
      return NextResponse.json(
        { error: "Failed to update comment" },
        { status: 500 }
      );
    }
  });
}

// Delete a specific comment
export async function DELETE(
  request: NextRequest,
  { params }: { params: { commentId: string } }
) {
  return withNextAuth(request, async (req, userId) => {
    try {
      const { commentId } = params;

      // Find the comment to verify ownership
      const comment = await prisma.comment.findUnique({
        where: { id: commentId },
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
        },
      });

      if (!comment) {
        return NextResponse.json(
          { error: "Comment not found" },
          { status: 404 }
        );
      }

      // Check if the user is the author or a group admin (if applicable)
      let isAuthorized = comment.authorId === userId;

      if (!isAuthorized && comment.post) {
        const groupId = comment.post.board.groupId;
        // Check if the user is a group admin
        const membership = await prisma.groupMember.findUnique({
          where: {
            userId_groupId: {
              userId,
              groupId,
            },
          },
        });

        isAuthorized = membership?.role === "ADMIN";
      }

      if (!isAuthorized) {
        return NextResponse.json(
          { error: "You are not authorized to delete this comment" },
          { status: 403 }
        );
      }

      // Delete the comment's reactions first
      await prisma.reaction.deleteMany({
        where: { commentId },
      });

      // Handle replies
      const replies = await prisma.comment.findMany({
        where: { parentId: commentId },
      });

      if (replies.length > 0) {
        // Option 1: Mark the comment as deleted but keep it for reply structure
        const updatedComment = await prisma.comment.update({
          where: { id: commentId },
          data: {
            encryptedContent: "",
            iv: "",
            keyId: null,
            isDeleted: true,
          },
        });

        // Log the action
        await prisma.userSecurityLog.create({
          data: {
            userId,
            action: "COMMENT_SOFT_DELETE",
            success: true,
            details: `Soft deleted comment ${commentId}`,
            ipAddress: req.headers.get("x-forwarded-for") || "unknown",
            userAgent: req.headers.get("user-agent") || "unknown",
          },
        });

        return NextResponse.json({
          message: "Comment has been marked as deleted",
          id: updatedComment.id,
        });
      } else {
        // Option 2: If no replies, fully delete the comment
        await prisma.comment.delete({
          where: { id: commentId },
        });

        // Log the action
        await prisma.userSecurityLog.create({
          data: {
            userId,
            action: "COMMENT_DELETE",
            success: true,
            details: `Deleted comment ${commentId}`,
            ipAddress: req.headers.get("x-forwarded-for") || "unknown",
            userAgent: req.headers.get("user-agent") || "unknown",
          },
        });

        return NextResponse.json({
          message: "Comment has been deleted",
          id: commentId,
        });
      }
    } catch (error) {
      console.error("Error deleting comment:", error);
      return NextResponse.json(
        { error: "Failed to delete comment" },
        { status: 500 }
      );
    }
  });
}
