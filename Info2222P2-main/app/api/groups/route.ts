import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { withNextAuth } from "@/lib/auth/middleware";
import { generateEncryptionKey } from "@/lib/encryption/crypto";

// Validation schema for group creation
const createGroupSchema = z.object({
  name: z.string().min(1, "Group name is required").max(100, "Group name is too long"),
  description: z.string().optional(),
  isPrivate: z.boolean().default(false),
});

// Create a new group
export async function POST(request: NextRequest) {
  return withNextAuth(request, async (req, userId) => {
    try {
      // Parse and validate request body
      const body = await req.json();
      const validationResult = createGroupSchema.safeParse(body);

      if (!validationResult.success) {
        return NextResponse.json(
          { error: "Validation failed", details: validationResult.error.format() },
          { status: 400 }
        );
      }

      const { name, description, isPrivate } = validationResult.data;

      // Create the group
      const group = await prisma.group.create({
        data: {
          name,
          description,
          isPrivate,
          ownerId: userId,
          // Add the creator as a member with OWNER role
          members: {
            create: {
              userId,
              role: "OWNER",
            },
          },
        },
        include: {
          members: true,
        },
      });

      // Generate a unique encryption key for this group's messages
      const groupKey = generateEncryptionKey();

      // Store the encryption key
      await prisma.encryptionKey.create({
        data: {
          keyType: "AES",
          keyValue: groupKey, // In production, this would be encrypted
          iv: "", // In production, this would be properly filled
          algorithm: "AES-256-GCM",
          groupId: group.id,
        },
      });

      // Remove sensitive information before returning
      const sanitizedGroup = {
        id: group.id,
        name: group.name,
        description: group.description,
        isPrivate: group.isPrivate,
        createdAt: group.createdAt,
        memberCount: group.members.length,
      };

      return NextResponse.json(sanitizedGroup, { status: 201 });
    } catch (error) {
      console.error("Group creation error:", error);
      return NextResponse.json(
        { error: "Failed to create group" },
        { status: 500 }
      );
    }
  });
}

// Get all groups the user is a member of
export async function GET(request: NextRequest) {
  return withNextAuth(request, async (req, userId) => {
    try {
      // Get query parameters
      const { searchParams } = new URL(req.url);
      const search = searchParams.get("search") || "";
      const page = parseInt(searchParams.get("page") || "1", 10);
      const limit = Math.min(parseInt(searchParams.get("limit") || "10", 10), 50); // Cap at 50 items per page
      const offset = (page - 1) * limit;

      // Find all groups where user is a member
      const groups = await prisma.group.findMany({
        where: {
          AND: [
            {
              members: {
                some: {
                  userId,
                },
              },
            },
            {
              // Optional search filter
              name: {
                contains: search,
                mode: "insensitive",
              },
            },
          ],
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
        orderBy: {
          updatedAt: "desc",
        },
        skip: offset,
        take: limit,
      });

      // Count total groups for pagination
      const totalGroups = await prisma.group.count({
        where: {
          AND: [
            {
              members: {
                some: {
                  userId,
                },
              },
            },
            {
              name: {
                contains: search,
                mode: "insensitive",
              },
            },
          ],
        },
      });

      // Transform the data to remove sensitive information
      const sanitizedGroups = groups.map((group) => ({
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
      }));

      // Return with pagination metadata
      return NextResponse.json({
        groups: sanitizedGroups,
        pagination: {
          total: totalGroups,
          page,
          limit,
          pages: Math.ceil(totalGroups / limit),
        },
      });
    } catch (error) {
      console.error("Error fetching groups:", error);
      return NextResponse.json(
        { error: "Failed to fetch groups" },
        { status: 500 }
      );
    }
  });
}
