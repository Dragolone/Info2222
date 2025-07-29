
Object.defineProperty(exports, "__esModule", { value: true });

const {
  Decimal,
  objectEnumValues,
  makeStrictEnum,
  Public,
  getRuntime,
  skip
} = require('./runtime/index-browser.js')


const Prisma = {}

exports.Prisma = Prisma
exports.$Enums = {}

/**
 * Prisma Client JS version: 6.6.0
 * Query Engine version: f676762280b54cd07c770017ed3711ddde35f37a
 */
Prisma.prismaVersion = {
  client: "6.6.0",
  engine: "f676762280b54cd07c770017ed3711ddde35f37a"
}

Prisma.PrismaClientKnownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientKnownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)};
Prisma.PrismaClientUnknownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientUnknownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientRustPanicError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientRustPanicError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientInitializationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientInitializationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientValidationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientValidationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.Decimal = Decimal

/**
 * Re-export of sql-template-tag
 */
Prisma.sql = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`sqltag is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.empty = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`empty is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.join = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`join is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.raw = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`raw is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.validator = Public.validator

/**
* Extensions
*/
Prisma.getExtensionContext = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.getExtensionContext is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.defineExtension = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.defineExtension is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}

/**
 * Shorthand utilities for JSON filtering
 */
Prisma.DbNull = objectEnumValues.instances.DbNull
Prisma.JsonNull = objectEnumValues.instances.JsonNull
Prisma.AnyNull = objectEnumValues.instances.AnyNull

Prisma.NullTypes = {
  DbNull: objectEnumValues.classes.DbNull,
  JsonNull: objectEnumValues.classes.JsonNull,
  AnyNull: objectEnumValues.classes.AnyNull
}



/**
 * Enums
 */

exports.Prisma.TransactionIsolationLevel = makeStrictEnum({
  Serializable: 'Serializable'
});

exports.Prisma.UserScalarFieldEnum = {
  id: 'id',
  username: 'username',
  email: 'email',
  hashedPassword: 'hashedPassword',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  isVerified: 'isVerified',
  verificationToken: 'verificationToken',
  verificationExpires: 'verificationExpires',
  resetToken: 'resetToken',
  resetTokenExpires: 'resetTokenExpires',
  lastLogin: 'lastLogin',
  twoFactorEnabled: 'twoFactorEnabled',
  twoFactorSecret: 'twoFactorSecret',
  lastPasswordChange: 'lastPasswordChange',
  previousPasswordHashes: 'previousPasswordHashes',
  displayName: 'displayName',
  avatarUrl: 'avatarUrl',
  bio: 'bio'
};

exports.Prisma.SessionScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  token: 'token',
  deviceInfo: 'deviceInfo',
  ipAddress: 'ipAddress',
  createdAt: 'createdAt',
  expiresAt: 'expiresAt',
  isRevoked: 'isRevoked'
};

exports.Prisma.GroupScalarFieldEnum = {
  id: 'id',
  name: 'name',
  description: 'description',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  ownerId: 'ownerId',
  isPrivate: 'isPrivate',
  avatarUrl: 'avatarUrl'
};

exports.Prisma.GroupMemberScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  groupId: 'groupId',
  role: 'role',
  joinedAt: 'joinedAt',
  invitedBy: 'invitedBy',
  notifyOnNewMessage: 'notifyOnNewMessage',
  notifyOnMention: 'notifyOnMention',
  notifyOnNewDiscussion: 'notifyOnNewDiscussion'
};

exports.Prisma.MessageScalarFieldEnum = {
  id: 'id',
  senderId: 'senderId',
  groupId: 'groupId',
  encryptedContent: 'encryptedContent',
  iv: 'iv',
  keyId: 'keyId',
  metaData: 'metaData',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  replyToId: 'replyToId',
  ephemeralExpiry: 'ephemeralExpiry',
  isEphemeral: 'isEphemeral'
};

exports.Prisma.MessageReadScalarFieldEnum = {
  id: 'id',
  messageId: 'messageId',
  userId: 'userId',
  readAt: 'readAt'
};

exports.Prisma.UserSecurityLogScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  action: 'action',
  ipAddress: 'ipAddress',
  userAgent: 'userAgent',
  timestamp: 'timestamp',
  success: 'success',
  details: 'details'
};

exports.Prisma.EncryptionKeyScalarFieldEnum = {
  id: 'id',
  keyType: 'keyType',
  keyValue: 'keyValue',
  iv: 'iv',
  algorithm: 'algorithm',
  createdAt: 'createdAt',
  expiresAt: 'expiresAt',
  isRevoked: 'isRevoked',
  groupId: 'groupId',
  relatedKeyId: 'relatedKeyId'
};

exports.Prisma.VulnerabilityDemoScalarFieldEnum = {
  id: 'id',
  vulnerabilityType: 'vulnerabilityType',
  description: 'description',
  mitigations: 'mitigations',
  demonstrationCode: 'demonstrationCode',
  createdAt: 'createdAt'
};

exports.Prisma.DiscussionBoardScalarFieldEnum = {
  id: 'id',
  name: 'name',
  description: 'description',
  groupId: 'groupId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  isArchived: 'isArchived',
  sortOrder: 'sortOrder'
};

exports.Prisma.DiscussionPostScalarFieldEnum = {
  id: 'id',
  title: 'title',
  encryptedContent: 'encryptedContent',
  iv: 'iv',
  keyId: 'keyId',
  authorId: 'authorId',
  boardId: 'boardId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  isLocked: 'isLocked',
  isPinned: 'isPinned',
  viewCount: 'viewCount'
};

exports.Prisma.CommentScalarFieldEnum = {
  id: 'id',
  encryptedContent: 'encryptedContent',
  iv: 'iv',
  keyId: 'keyId',
  authorId: 'authorId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  parentId: 'parentId',
  postId: 'postId',
  fileId: 'fileId'
};

exports.Prisma.ReactionScalarFieldEnum = {
  id: 'id',
  type: 'type',
  userId: 'userId',
  createdAt: 'createdAt',
  messageId: 'messageId',
  postId: 'postId',
  commentId: 'commentId',
  fileId: 'fileId'
};

exports.Prisma.FileScalarFieldEnum = {
  id: 'id',
  filename: 'filename',
  originalName: 'originalName',
  mimeType: 'mimeType',
  size: 'size',
  path: 'path',
  isEncrypted: 'isEncrypted',
  encryptionKeyId: 'encryptionKeyId',
  encryptionIv: 'encryptionIv',
  checksum: 'checksum',
  uploaderId: 'uploaderId',
  groupId: 'groupId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  isArchived: 'isArchived',
  thumbnailPath: 'thumbnailPath',
  metadata: 'metadata'
};

exports.Prisma.PinnedItemScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  groupId: 'groupId',
  itemType: 'itemType',
  itemId: 'itemId',
  pinnedAt: 'pinnedAt',
  note: 'note'
};

exports.Prisma.TaskScalarFieldEnum = {
  id: 'id',
  title: 'title',
  description: 'description',
  status: 'status',
  priority: 'priority',
  dueDate: 'dueDate',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  creatorId: 'creatorId',
  groupId: 'groupId'
};

exports.Prisma.TaskAssignmentScalarFieldEnum = {
  id: 'id',
  taskId: 'taskId',
  userId: 'userId',
  assignedAt: 'assignedAt'
};

exports.Prisma.SortOrder = {
  asc: 'asc',
  desc: 'desc'
};

exports.Prisma.NullsOrder = {
  first: 'first',
  last: 'last'
};


exports.Prisma.ModelName = {
  User: 'User',
  Session: 'Session',
  Group: 'Group',
  GroupMember: 'GroupMember',
  Message: 'Message',
  MessageRead: 'MessageRead',
  UserSecurityLog: 'UserSecurityLog',
  EncryptionKey: 'EncryptionKey',
  VulnerabilityDemo: 'VulnerabilityDemo',
  DiscussionBoard: 'DiscussionBoard',
  DiscussionPost: 'DiscussionPost',
  Comment: 'Comment',
  Reaction: 'Reaction',
  File: 'File',
  PinnedItem: 'PinnedItem',
  Task: 'Task',
  TaskAssignment: 'TaskAssignment'
};

/**
 * This is a stub Prisma Client that will error at runtime if called.
 */
class PrismaClient {
  constructor() {
    return new Proxy(this, {
      get(target, prop) {
        let message
        const runtime = getRuntime()
        if (runtime.isEdge) {
          message = `PrismaClient is not configured to run in ${runtime.prettyName}. In order to run Prisma Client on edge runtime, either:
- Use Prisma Accelerate: https://pris.ly/d/accelerate
- Use Driver Adapters: https://pris.ly/d/driver-adapters
`;
        } else {
          message = 'PrismaClient is unable to run in this browser environment, or has been bundled for the browser (running in `' + runtime.prettyName + '`).'
        }

        message += `
If this is unexpected, please open an issue: https://pris.ly/prisma-prisma-bug-report`

        throw new Error(message)
      }
    })
  }
}

exports.PrismaClient = PrismaClient

Object.assign(exports, Prisma)
