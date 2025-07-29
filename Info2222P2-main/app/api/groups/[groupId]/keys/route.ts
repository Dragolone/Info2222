import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { withNextAuth } from "@/lib/auth/middleware";
const { sendToUser } = require("../../../../../server");

// Validation schema for sharing a group key
const shareGroupKeySchema = z.object({
  recipientId: z.string().uuid("Invalid recipient ID"),
  encryptedKey: z.string().min(20, "Invalid encrypted key format"),
});

// Get all encrypted group keys shared with the current user
export async function GET(
  request: NextRequest,
  { params }: { params: { groupId: string } }
) {
  return withNextAuth(request, async (req, userId) => {
    try {
      const { groupId } = params;

      // Check if the user is a member of the group
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
          { error: "You do not have permission to access this group's keys" },
          { status: 403 }
        );
      }

      // Fetch shared group keys for this user
      const sharedKeys = await prisma.encryptionKey.findMany({
        where: {
          keyType: "GROUP_E2EE_KEY",
          groupId,
          // User ID is stored in algorithm field for the recipient
          algorithm: `RECIPIENT:${userId}`,
          isRevoked: false,
          expiresAt: { gt: new Date() },
        },
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          keyValue: true, // This contains the encrypted group key
          relatedKeyId: true, // This contains the sender's user ID
          createdAt: true,
        },
      });

      // Format the response
      const formattedKeys = await Promise.all(
        sharedKeys.map(async (key) => {
          // Get sender info
          const sender = await prisma.user.findUnique({
            where: { id: key.relatedKeyId || "" },
            select: { username: true },
          });

          return {
            id: key.id,
            encryptedKey: key.keyValue,
            senderId: key.relatedKeyId,
            senderUsername: sender?.username || "Unknown",
            sharedAt: key.createdAt,
          };
        })
      );

      return NextResponse.json(formattedKeys);
    } catch (error) {
      console.error("Error fetching shared group keys:", error);
      return NextResponse.json(
        { error: "Failed to fetch shared group keys" },
        { status: 500 }
      );
    }
  });
}

// Share an encrypted group key with another user
export async function POST(
  request: NextRequest,
  { params }: { params: { groupId: string } }
) {
  return withNextAuth(request, async (req, userId) => {
    try {
      const { groupId } = params;

      // Parse and validate request body
      const body = await req.json();
      const validationResult = shareGroupKeySchema.safeParse(body);

      if (!validationResult.success) {
        return NextResponse.json(
          { error: "Validation failed", details: validationResult.error.format() },
          { status: 400 }
        );
      }

      const { recipientId, encryptedKey } = validationResult.data;

      // Check if the sender is a member of the group
      const senderMembership = await prisma.groupMember.findUnique({
        where: {
          userId_groupId: {
            userId,
            groupId,
          },
        },
      });

      if (!senderMembership) {
        return NextResponse.json(
          { error: "You do not have permission to share keys for this group" },
          { status: 403 }
        );
      }

      // Check if the recipient is a member of the group
      const recipientMembership = await prisma.groupMember.findUnique({
        where: {
          userId_groupId: {
            userId: recipientId,
            groupId,
          },
        },
      });

      if (!recipientMembership) {
        return NextResponse.json(
          { error: "Recipient is not a member of this group" },
          { status: 400 }
        );
      }

      // Store the encrypted group key
      const sharedKey = await prisma.encryptionKey.create({
        data: {
          keyType: "GROUP_E2EE_KEY",
          keyValue: encryptedKey,
          algorithm: `RECIPIENT:${recipientId}`, // Store recipient ID in algorithm field
          iv: "", // Not needed for RSA-encrypted keys
          expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days expiry
          isRevoked: false,
          groupId,
          relatedKeyId: userId, // Store sender ID in relatedKeyId
        },
      });

      // Get sender info for notification
      const sender = await prisma.user.findUnique({
        where: { id: userId },
        select: { username: true },
      });

      // Get group info
      const group = await prisma.group.findUnique({
        where: { id: groupId },
        select: { name: true },
      });

      // Notify the recipient via WebSocket
      sendToUser(recipientId, {
        type: "group_key_shared",
        groupId,
        groupName: group?.name || "Unknown group",
        senderId: userId,
        senderUsername: sender?.username || "Unknown user",
        keyId: sharedKey.id,
        timestamp: new Date().toISOString(),
      });

      return NextResponse.json({
        message: "Group key shared successfully",
        keyId: sharedKey.id,
      }, { status: 201 });
    } catch (error) {
      console.error("Error sharing group key:", error);
      return NextResponse.json(
        { error: "Failed to share group key" },
        { status: 500 }
      );
    }
  });
}

// Delete a shared group key (useful if a user leaves a group or key is compromised)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { groupId: string } }
) {
  return withNextAuth(request, async (req, userId) => {
    try {
      const { groupId } = params;
      const { searchParams } = new URL(req.url);
      const keyId = searchParams.get("keyId");

      if (!keyId) {
        return NextResponse.json(
          { error: "Key ID is required" },
          { status: 400 }
        );
      }

      // Check if the user is a member of the group with appropriate permissions
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
          { error: "You do not have permission to manage keys for this group" },
          { status: 403 }
        );
      }

      // Revoke the key
      await prisma.encryptionKey.update({
        where: {
          id: keyId,
          groupId, // Ensure the key belongs to this group
        },
        data: {
          isRevoked: true,
          expiresAt: new Date(), // Expire immediately
        },
      });

      return NextResponse.json({
        message: "Group key revoked successfully",
      });
    } catch (error) {
      console.error("Error revoking group key:", error);
      return NextResponse.json(
        { error: "Failed to revoke group key" },
        { status: 500 }
      );
    }
  });
}
