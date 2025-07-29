import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { withNextAuth } from "@/lib/auth/middleware";

// Validation schema for creating/toggling a reaction
const reactionSchema = z.object({
  type: z.enum([
    "LIKE",
    "HEART",
    "CELEBRATE",
    "THUMBS_UP",
    "THUMBS_DOWN",
    "BOOKMARK",
    "IMPORTANT",
    "FLAG"
  ]),
  // Only one of these should be provided
  messageId: z.string().uuid("Invalid message ID").optional(),
  postId: z.string().uuid("Invalid post ID").optional(),
  commentId: z.string().uuid("Invalid comment ID").optional(),
  fileId: z.string().uuid("Invalid file ID").optional(),
}).refine(
  (data) => {
    // Ensure exactly one content ID is provided
    const providedIds = [
      data.messageId,
      data.postId,
      data.commentId,
      data.fileId
    ].filter(Boolean);

    return providedIds.length === 1;
  },
  {
    message: "Exactly one of messageId, postId, commentId, or fileId must be provided",
    path: ["contentId"],
  }
);

// Get reactions for a specific content item
export async function GET(request: NextRequest) {
  return withNextAuth(request, async (req, userId) => {
    try {
      // Get and validate query parameters
      const { searchParams } = new URL(req.url);

      const messageId = searchParams.get("messageId");
      const postId = searchParams.get("postId");
      const commentId = searchParams.get("commentId");
      const fileId = searchParams.get("fileId");

      // Ensure exactly one content ID is provided
      const providedIds = [messageId, postId, commentId, fileId].filter(Boolean);

      if (providedIds.length !== 1) {
        return NextResponse.json(
          { error: "Exactly one of messageId, postId, commentId, or fileId must be provided" },
          { status: 400 }
        );
      }

      // Build the where condition based on the provided ID
      const where: any = {};

      if (messageId) {
        where.messageId = messageId;

        // Check if user has access to the message (group membership)
        const message = await prisma.message.findUnique({
          where: { id: messageId },
          select: { groupId: true }
        });

        if (!message) {
          return NextResponse.json(
            { error: "Message not found" },
            { status: 404 }
          );
        }

        const membership = await prisma.groupMember.findUnique({
          where: {
            userId_groupId: {
              userId,
              groupId: message.groupId,
            },
          },
        });

        if (!membership) {
          return NextResponse.json(
            { error: "You do not have access to this content" },
            { status: 403 }
          );
        }
      } else if (postId) {
        where.postId = postId;

        // Check if user has access to the post (group membership)
        const post = await prisma.discussionPost.findUnique({
          where: { id: postId },
          select: { board: { select: { groupId: true } } }
        });

        if (!post) {
          return NextResponse.json(
            { error: "Post not found" },
            { status: 404 }
          );
        }

        const membership = await prisma.groupMember.findUnique({
          where: {
            userId_groupId: {
              userId,
              groupId: post.board.groupId,
            },
          },
        });

        if (!membership) {
          return NextResponse.json(
            { error: "You do not have access to this content" },
            { status: 403 }
          );
        }
      } else if (commentId) {
        where.commentId = commentId;

        // For comments, we need to check what the comment is attached to
        const comment = await prisma.comment.findUnique({
          where: { id: commentId },
          select: {
            postId: true,
            post: { select: { board: { select: { groupId: true } } } },
            fileId: true,
            file: { select: { groupId: true } }
          }
        });

        if (!comment) {
          return NextResponse.json(
            { error: "Comment not found" },
            { status: 404 }
          );
        }

        // Get the group ID from either post or file
        const groupId = comment.postId
          ? comment.post?.board.groupId
          : comment.file?.groupId;

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
      } else if (fileId) {
        where.fileId = fileId;

        // Check if user has access to the file
        const file = await prisma.file.findUnique({
          where: { id: fileId },
          select: { groupId: true, uploaderId: true }
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

        // If it's a group file, check membership
        if (file.groupId) {
          const membership = await prisma.groupMember.findUnique({
            where: {
              userId_groupId: {
                userId,
                groupId: file.groupId,
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
      }

      // Fetch reactions
      const reactions = await prisma.reaction.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      // Group reactions by type for easier UI rendering
      const reactionsByType = reactions.reduce((acc, reaction) => {
        if (!acc[reaction.type]) {
          acc[reaction.type] = [];
        }
        acc[reaction.type].push(reaction);
        return acc;
      }, {} as Record<string, typeof reactions>);

      return NextResponse.json({
        reactions,
        reactionsByType,
        userReactions: reactions.filter(r => r.userId === userId),
      });
    } catch (error) {
      console.error("Error fetching reactions:", error);
      return NextResponse.json(
        { error: "Failed to fetch reactions" },
        { status: 500 }
      );
    }
  });
}

// Toggle (add/remove) a reaction
export async function POST(request: NextRequest) {
  return withNextAuth(request, async (req, userId) => {
    try {
      // Parse and validate request body
      const body = await req.json();
      const validationResult = reactionSchema.safeParse(body);

      if (!validationResult.success) {
        return NextResponse.json(
          { error: "Validation failed", details: validationResult.error.format() },
          { status: 400 }
        );
      }

      const { type, messageId, postId, commentId, fileId } = validationResult.data;

      // Check access permissions based on the content type
      let groupId: string | null = null;

      if (messageId) {
        // Check if user has access to the message
        const message = await prisma.message.findUnique({
          where: { id: messageId },
          select: { groupId: true }
        });

        if (!message) {
          return NextResponse.json(
            { error: "Message not found" },
            { status: 404 }
          );
        }

        groupId = message.groupId;
      } else if (postId) {
        // Check if user has access to the post
        const post = await prisma.discussionPost.findUnique({
          where: { id: postId },
          select: { board: { select: { groupId: true } } }
        });

        if (!post) {
          return NextResponse.json(
            { error: "Post not found" },
            { status: 404 }
          );
        }

        groupId = post.board.groupId;
      } else if (commentId) {
        // For comments, check the parent content
        const comment = await prisma.comment.findUnique({
          where: { id: commentId },
          select: {
            postId: true,
            post: { select: { board: { select: { groupId: true } } } },
            fileId: true,
            file: { select: { groupId: true } }
          }
        });

        if (!comment) {
          return NextResponse.json(
            { error: "Comment not found" },
            { status: 404 }
          );
        }

        groupId = comment.postId
          ? comment.post?.board.groupId
          : comment.file?.groupId;
      } else if (fileId) {
        // Check if user has access to the file
        const file = await prisma.file.findUnique({
          where: { id: fileId },
          select: { groupId: true, uploaderId: true }
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

      // Check if reaction already exists (toggle behavior)
      const existingReaction = await prisma.reaction.findFirst({
        where: {
          userId,
          type,
          messageId,
          postId,
          commentId,
          fileId,
        },
      });

      if (existingReaction) {
        // Remove the reaction if it exists
        await prisma.reaction.delete({
          where: {
            id: existingReaction.id,
          },
        });

        return NextResponse.json({
          action: "removed",
          reactionId: existingReaction.id,
        });
      } else {
        // Add the reaction if it doesn't exist
        const reaction = await prisma.reaction.create({
          data: {
            type,
            userId,
            messageId,
            postId,
            commentId,
            fileId,
          },
        });

        return NextResponse.json({
          action: "added",
          reaction,
        });
      }
    } catch (error) {
      console.error("Error toggling reaction:", error);
      return NextResponse.json(
        { error: "Failed to toggle reaction" },
        { status: 500 }
      );
    }
  });
}
