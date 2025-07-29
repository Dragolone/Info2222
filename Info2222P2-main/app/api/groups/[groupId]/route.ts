import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { withNextAuth } from "@/lib/auth/middleware";

// Validation schema for group updates
const updateGroupSchema = z.object({
  name: z.string().min(1, "Group name is required").max(100, "Group name is too long").optional(),
  description: z.string().optional(),
  isPrivate: z.boolean().optional(),
});

// Get a specific group
export async function GET(
  request: NextRequest,
  { params }: { params: { groupId: string } }
) {
  return withNextAuth(request, async (req, userId) => {
    try {
      const { groupId } = params;

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

      // Get group details with members and message count
      const group = await prisma.group.findUnique({
        where: {
          id: groupId,
        },
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                },
              },
            },
          },
          _count: {
            select: {
              messages: true,
            },
          },
        },
      });

      if (!group) {
        return NextResponse.json(
          { error: "Group not found" },
          { status: 404 }
        );
      }

      // Transform the data to remove sensitive information
      const sanitizedGroup = {
        id: group.id,
        name: group.name,
        description: group.description,
        isPrivate: group.isPrivate,
        createdAt: group.createdAt,
        updatedAt: group.updatedAt,
        ownerId: group.ownerId,
        isOwner: group.ownerId === userId,
        memberCount: group.members.length,
        messageCount: group._count.messages,
        userRole: group.members.find((member) => member.userId === userId)?.role || "MEMBER",
        // Include minimal member information
        members: group.members.map((member) => ({
          id: member.id,
          userId: member.userId,
          username: member.user.username,
          role: member.role,
          joinedAt: member.joinedAt,
        })),
      };

      return NextResponse.json(sanitizedGroup);
    } catch (error) {
      console.error("Error fetching group:", error);
      return NextResponse.json(
        { error: "Failed to fetch group" },
        { status: 500 }
      );
    }
  });
}

// Update a group
export async function PATCH(
  request: NextRequest,
  { params }: { params: { groupId: string } }
) {
  return withNextAuth(request, async (req, userId) => {
    try {
      const { groupId } = params;

      // Check if user is the owner or admin of the group
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
          { error: "You do not have permission to update this group" },
          { status: 403 }
        );
      }

      // Parse and validate request body
      const body = await req.json();
      const validationResult = updateGroupSchema.safeParse(body);

      if (!validationResult.success) {
        return NextResponse.json(
          { error: "Validation failed", details: validationResult.error.format() },
          { status: 400 }
        );
      }

      const updateData = validationResult.data;

      // Prevent non-owners from changing isPrivate status
      if (membership.role !== "OWNER" && updateData.isPrivate !== undefined) {
        return NextResponse.json(
          { error: "Only the group owner can change privacy settings" },
          { status: 403 }
        );
      }

      // Update the group
      const updatedGroup = await prisma.group.update({
        where: {
          id: groupId,
        },
        data: updateData,
      });

      // Log the update action
      await prisma.userSecurityLog.create({
        data: {
          userId,
          action: "GROUP_UPDATE",
          success: true,
          details: `Group ${groupId} updated`,
          ipAddress: req.headers.get("x-forwarded-for") || "unknown",
          userAgent: req.headers.get("user-agent") || "unknown",
        },
      });

      return NextResponse.json({
        id: updatedGroup.id,
        name: updatedGroup.name,
        description: updatedGroup.description,
        isPrivate: updatedGroup.isPrivate,
        updatedAt: updatedGroup.updatedAt,
      });
    } catch (error) {
      console.error("Error updating group:", error);
      return NextResponse.json(
        { error: "Failed to update group" },
        { status: 500 }
      );
    }
  });
}

// Delete a group
export async function DELETE(
  request: NextRequest,
  { params }: { params: { groupId: string } }
) {
  return withNextAuth(request, async (req, userId) => {
    try {
      const { groupId } = params;

      // Check if user is the owner of the group
      const group = await prisma.group.findUnique({
        where: {
          id: groupId,
        },
      });

      if (!group) {
        return NextResponse.json(
          { error: "Group not found" },
          { status: 404 }
        );
      }

      if (group.ownerId !== userId) {
        return NextResponse.json(
          { error: "Only the group owner can delete this group" },
          { status: 403 }
        );
      }

      // Delete all group messages
      await prisma.message.deleteMany({
        where: {
          groupId,
        },
      });

      // Delete group members
      await prisma.groupMember.deleteMany({
        where: {
          groupId,
        },
      });

      // Delete encryption keys
      await prisma.encryptionKey.deleteMany({
        where: {
          groupId,
        },
      });

      // Delete the group
      await prisma.group.delete({
        where: {
          id: groupId,
        },
      });

      // Log the delete action
      await prisma.userSecurityLog.create({
        data: {
          userId,
          action: "GROUP_DELETE",
          success: true,
          details: `Group ${groupId} deleted`,
          ipAddress: req.headers.get("x-forwarded-for") || "unknown",
          userAgent: req.headers.get("user-agent") || "unknown",
        },
      });

      return NextResponse.json(
        { message: "Group deleted successfully" },
        { status: 200 }
      );
    } catch (error) {
      console.error("Error deleting group:", error);
      return NextResponse.json(
        { error: "Failed to delete group" },
        { status: 500 }
      );
    }
  });
}
