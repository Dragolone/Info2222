import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { withNextAuth } from "@/lib/auth/middleware";

// Validation schema for storing public key
const storePublicKeySchema = z.object({
  publicKey: z.string().min(100, "Invalid public key format"),
});

// Store the user's public key
export async function POST(request: NextRequest) {
  return withNextAuth(request, async (req, userId) => {
    try {
      // Parse and validate request body
      const body = await req.json();
      const validationResult = storePublicKeySchema.safeParse(body);

      if (!validationResult.success) {
        return NextResponse.json(
          { error: "Validation failed", details: validationResult.error.format() },
          { status: 400 }
        );
      }

      const { publicKey } = validationResult.data;

      // Check if we need to create or update
      const existingKey = await prisma.encryptionKey.findFirst({
        where: {
          keyType: "RSA_PUBLIC",
          keyValue: { contains: "BEGIN PUBLIC KEY" },
          // Use relatedKey to store reference to user
          relatedKeyId: userId,
        },
      });

      if (existingKey) {
        // Update existing key
        await prisma.encryptionKey.update({
          where: {
            id: existingKey.id,
          },
          data: {
            keyValue: publicKey,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days expiry
          },
        });
      } else {
        // Create new key entry
        await prisma.encryptionKey.create({
          data: {
            keyType: "RSA_PUBLIC",
            keyValue: publicKey,
            algorithm: "RSA-OAEP-256",
            iv: "", // Not needed for public key
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days expiry
            isRevoked: false,
            relatedKeyId: userId, // Store user ID in relatedKeyId for reference
          },
        });
      }

      return NextResponse.json({
        message: "Public key stored successfully",
      });
    } catch (error) {
      console.error("Error storing public key:", error);
      return NextResponse.json(
        { error: "Failed to store public key" },
        { status: 500 }
      );
    }
  });
}

// Get public keys for users in a group
export async function GET(request: NextRequest) {
  return withNextAuth(request, async (req, userId) => {
    try {
      // Get and validate query parameters
      const { searchParams } = new URL(req.url);
      const groupId = searchParams.get("groupId");

      if (!groupId) {
        return NextResponse.json(
          { error: "Group ID is required" },
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
          { error: "You do not have permission to access this group's data" },
          { status: 403 }
        );
      }

      // Get all members of the group
      const members = await prisma.groupMember.findMany({
        where: {
          groupId,
        },
        select: {
          userId: true,
          user: {
            select: {
              username: true,
            },
          },
        },
      });

      // Get public keys for all members
      const memberIds = members.map(member => member.userId);

      const publicKeys = await prisma.encryptionKey.findMany({
        where: {
          keyType: "RSA_PUBLIC",
          relatedKeyId: { in: memberIds },
          isRevoked: false,
          expiresAt: { gt: new Date() },
        },
      });

      // Format response
      const userPublicKeys = members.map(member => {
        const key = publicKeys.find(k => k.relatedKeyId === member.userId);
        return {
          userId: member.userId,
          username: member.user.username,
          publicKey: key ? key.keyValue : null,
        };
      });

      return NextResponse.json(userPublicKeys);
    } catch (error) {
      console.error("Error fetching public keys:", error);
      return NextResponse.json(
        { error: "Failed to fetch public keys" },
        { status: 500 }
      );
    }
  });
}
