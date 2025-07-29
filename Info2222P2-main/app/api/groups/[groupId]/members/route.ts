import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { withNextAuth } from "@/lib/auth/middleware";

// Validation schema for adding members
const addMemberSchema = z.object({
  userId: z.string().uuid("Invalid user ID"),
  role: z.enum(["ADMIN", "MEMBER"]).default("MEMBER"),
});

// Get all members of a group
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

      // Get all members with user details
      const members = await prisma.groupMember.findMany({
        where: {
          groupId,
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
        },
        orderBy: {
          role: "asc", // OWNER first, then ADMIN, then MEMBER
        },
      });

      // Transform data to sanitize it
      const sanitizedMembers = members.map((member) => ({
        id: member.id,
        userId: member.userId,
        username: member.user.username,
        // Only include email if the requester is an admin or owner
        email: ["OWNER", "ADMIN"].includes(membership.role) ? member.user.email : undefined,
        role: member.role,
        joinedAt: member.joinedAt,
        invitedBy: member.invitedBy,
      }));

      return NextResponse.json(sanitizedMembers);
    } catch (error) {
      console.error("Error fetching group members:", error);
      return NextResponse.json(
        { error: "Failed to fetch group members" },
        { status: 500 }
      );
    }
  });
}

// Add a member to a group
export async function POST(
  request: NextRequest,
  { params }: { params: { groupId: string } }
) {
  return withNextAuth(request, async (req, userId) => {
    try {
      const { groupId } = params;

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
          { error: "You do not have permission to add members to this group" },
          { status: 403 }
        );
      }

      // Parse and validate request body
      const body = await req.json();
      const validationResult = addMemberSchema.safeParse(body);

      if (!validationResult.success) {
        return NextResponse.json(
          { error: "Validation failed", details: validationResult.error.format() },
          { status: 400 }
        );
      }

      const { userId: newMemberId, role } = validationResult.data;

      // Prevent making someone an ADMIN if the current user is not an OWNER
      if (role === "ADMIN" && membership.role !== "OWNER") {
        return NextResponse.json(
          { error: "Only the group owner can add admin members" },
          { status: 403 }
        );
      }

      // Check if user exists
      const userExists = await prisma.user.findUnique({
        where: {
          id: newMemberId,
        },
      });

      if (!userExists) {
        return NextResponse.json(
          { error: "User not found" },
          { status: 404 }
        );
      }

      // Check if user is already a member
      const existingMembership = await prisma.groupMember.findUnique({
        where: {
          userId_groupId: {
            userId: newMemberId,
            groupId,
          },
        },
      });

      if (existingMembership) {
        return NextResponse.json(
          { error: "User is already a member of this group" },
          { status: 409 }
        );
      }

      // Add the member
      const newMember = await prisma.groupMember.create({
        data: {
          userId: newMemberId,
          groupId,
          role,
          invitedBy: userId,
        },
        include: {
          user: {
            select: {
              username: true,
            },
          },
        },
      });

      // Log the action
      await prisma.userSecurityLog.create({
        data: {
          userId,
          action: "GROUP_MEMBER_ADD",
          success: true,
          details: `Added user ${newMemberId} to group ${groupId} with role ${role}`,
          ipAddress: req.headers.get("x-forwarded-for") || "unknown",
          userAgent: req.headers.get("user-agent") || "unknown",
        },
      });

      return NextResponse.json({
        id: newMember.id,
        userId: newMember.userId,
        username: newMember.user.username,
        role: newMember.role,
        joinedAt: newMember.joinedAt,
        invitedBy: newMember.invitedBy,
      }, { status: 201 });
    } catch (error) {
      console.error("Error adding group member:", error);
      return NextResponse.json(
        { error: "Failed to add member to group" },
        { status: 500 }
      );
    }
  });
}
