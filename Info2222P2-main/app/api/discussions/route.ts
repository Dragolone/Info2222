import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { withNextAuth } from "@/lib/auth/middleware";
import { aesEncrypt, aesDecrypt } from "@/lib/encryption/crypto";
import { getCurrentKey } from "@/lib/encryption/keyManager";

// Validation schema for creating a discussion board
const createBoardSchema = z.object({
  name: z.string().min(1, "Board name is required").max(100),
  description: z.string().optional(),
  groupId: z.string().uuid("Invalid group ID"),
});

// Validation schema for listing boards
const listBoardsSchema = z.object({
  groupId: z.string().uuid("Invalid group ID"),
  includeArchived: z.boolean().optional().default(false),
});

// Get all discussion boards for a group
export async function GET(request: NextRequest) {
  return withNextAuth(request, async (req, userId) => {
    try {
      // Get and validate query parameters
      const { searchParams } = new URL(req.url);
      const groupId = searchParams.get("groupId");
      const includeArchived = searchParams.get("includeArchived") === "true";

      if (!groupId) {
        return NextResponse.json(
          { error: "Group ID is required" },
          { status: 400 }
        );
      }

      const validationResult = listBoardsSchema.safeParse({
        groupId,
        includeArchived,
      });

      if (!validationResult.success) {
        return NextResponse.json(
          { error: "Validation failed", details: validationResult.error.format() },
          { status: 400 }
        );
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
        return NextResponse.json(
          { error: "You do not have access to this group" },
          { status: 403 }
        );
      }

      // Get all boards for the group
      const boards = await prisma.discussionBoard.findMany({
        where: {
          groupId,
          isArchived: includeArchived ? undefined : false,
        },
        orderBy: [
          { sortOrder: "asc" },
          { updatedAt: "desc" },
        ],
        include: {
          _count: {
            select: {
              posts: true,
            },
          },
        },
      });

      return NextResponse.json(boards);
    } catch (error) {
      console.error("Error fetching discussion boards:", error);
      return NextResponse.json(
        { error: "Failed to fetch discussion boards" },
        { status: 500 }
      );
    }
  });
}

// Create a new discussion board
export async function POST(request: NextRequest) {
  return withNextAuth(request, async (req, userId) => {
    try {
      // Parse and validate request body
      const body = await req.json();
      const validationResult = createBoardSchema.safeParse(body);

      if (!validationResult.success) {
        return NextResponse.json(
          { error: "Validation failed", details: validationResult.error.format() },
          { status: 400 }
        );
      }

      const { name, description, groupId } = validationResult.data;

      // Check if user is an admin or owner of the group
      const membership = await prisma.groupMember.findUnique({
        where: {
          userId_groupId: {
            userId,
            groupId,
          },
        },
      });

      if (!membership || !["OWNER", "ADMIN"].includes(membership.role)) {
        return NextResponse.json(
          { error: "You do not have permission to create discussion boards in this group" },
          { status: 403 }
        );
      }

      // Get the count of existing boards to determine sort order
      const boardCount = await prisma.discussionBoard.count({
        where: { groupId },
      });

      // Create the discussion board
      const board = await prisma.discussionBoard.create({
        data: {
          name,
          description,
          groupId,
          sortOrder: boardCount, // Place at the end by default
        },
      });

      // Log the action
      await prisma.userSecurityLog.create({
        data: {
          userId,
          action: "DISCUSSION_BOARD_CREATE",
          success: true,
          details: `Created discussion board ${board.id} in group ${groupId}`,
          ipAddress: req.headers.get("x-forwarded-for") || "unknown",
          userAgent: req.headers.get("user-agent") || "unknown",
        },
      });

      return NextResponse.json(board, { status: 201 });
    } catch (error) {
      console.error("Error creating discussion board:", error);
      return NextResponse.json(
        { error: "Failed to create discussion board" },
        { status: 500 }
      );
    }
  });
}
