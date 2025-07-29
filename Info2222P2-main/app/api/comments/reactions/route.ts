import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { withNextAuth } from "@/lib/auth/middleware";

// Validation schema for adding/updating a reaction
const reactionSchema = z.object({
  commentId: z.string().uuid(),
  reactionType: z.enum(["LIKE", "LOVE", "LAUGH", "CURIOUS", "INSIGHTFUL"]),
});

// Validation schema for removing a reaction
const removeReactionSchema = z.object({
  commentId: z.string().uuid(),
});

// Get reactions for a specific comment
export async function GET(request: NextRequest) {
  return withNextAuth(request, async (req, userId) => {
    try {
      // Extract and validate query parameters
      const { searchParams } = new URL(req.url);
      const commentId = searchParams.get("commentId");

      if (!commentId) {
        return NextResponse.json(
          { error: "Comment ID is required" },
          { status: 400 }
        );
      }

      // Check if the comment exists
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
              uploaderId: true,
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

      // Fetch reactions for the comment
      const reactions = await prisma.reaction.findMany({
        where: { commentId },
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
      });

      // Group reactions by type for summary
      const reactionSummary = reactions.reduce((acc, reaction) => {
        acc[reaction.reactionType] = (acc[reaction.reactionType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Get the user's reaction if any
      const userReaction = reactions.find(r => r.userId === userId);

      return NextResponse.json({
        reactions,
        summary: reactionSummary,
        total: reactions.length,
        userReaction: userReaction || null,
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

// Add or update a reaction
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

      const { commentId, reactionType } = validationResult.data;

      // Check if the comment exists
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
              uploaderId: true,
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

      // Check if the user already has a reaction for this comment
      const existingReaction = await prisma.reaction.findUnique({
        where: {
          userId_commentId: {
            userId,
            commentId,
          },
        },
      });

      let reaction;

      if (existingReaction) {
        // Update the existing reaction if the type is different
        if (existingReaction.reactionType !== reactionType) {
          reaction = await prisma.reaction.update({
            where: {
              id: existingReaction.id,
            },
            data: {
              reactionType,
            },
          });
        } else {
          // If the reaction type is the same, return the existing reaction
          reaction = existingReaction;
        }
      } else {
        // Create a new reaction
        reaction = await prisma.reaction.create({
          data: {
            userId,
            commentId,
            reactionType,
          },
        });

        // Log the action
        await prisma.userSecurityLog.create({
          data: {
            userId,
            action: "REACTION_CREATE",
            success: true,
            details: `Added ${reactionType} reaction to comment ${commentId}`,
            ipAddress: req.headers.get("x-forwarded-for") || "unknown",
            userAgent: req.headers.get("user-agent") || "unknown",
          },
        });
      }

      return NextResponse.json(reaction);
    } catch (error) {
      console.error("Error adding/updating reaction:", error);
      return NextResponse.json(
        { error: "Failed to add/update reaction" },
        { status: 500 }
      );
    }
  });
}

// Remove a reaction
export async function DELETE(request: NextRequest) {
  return withNextAuth(request, async (req, userId) => {
    try {
      // Parse and validate request body
      const body = await req.json();
      const validationResult = removeReactionSchema.safeParse(body);

      if (!validationResult.success) {
        return NextResponse.json(
          { error: "Validation failed", details: validationResult.error.format() },
          { status: 400 }
        );
      }

      const { commentId } = validationResult.data;

      // Check if the reaction exists
      const existingReaction = await prisma.reaction.findUnique({
        where: {
          userId_commentId: {
            userId,
            commentId,
          },
        },
      });

      if (!existingReaction) {
        return NextResponse.json(
          { error: "Reaction not found" },
          { status: 404 }
        );
      }

      // Delete the reaction
      await prisma.reaction.delete({
        where: {
          id: existingReaction.id,
        },
      });

      // Log the action
      await prisma.userSecurityLog.create({
        data: {
          userId,
          action: "REACTION_DELETE",
          success: true,
          details: `Removed ${existingReaction.reactionType} reaction from comment ${commentId}`,
          ipAddress: req.headers.get("x-forwarded-for") || "unknown",
          userAgent: req.headers.get("user-agent") || "unknown",
        },
      });

      return NextResponse.json({
        message: "Reaction removed successfully",
        id: existingReaction.id,
      });
    } catch (error) {
      console.error("Error removing reaction:", error);
      return NextResponse.json(
        { error: "Failed to remove reaction" },
        { status: 500 }
      );
    }
  });
}
