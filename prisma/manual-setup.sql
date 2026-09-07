-- Run this entire file in Neon's SQL Editor (neon.tech -> your project -> "SQL Editor" in the sidebar).
-- This creates the exact same tables that `npx prisma db push` would have created.
-- Paste everything below into the editor and click "Run" once.

CREATE TYPE "Role" AS ENUM ('OWNER', 'ADMIN', 'EDITOR', 'VIEWER');
CREATE TYPE "DocType" AS ENUM ('SOP', 'KB', 'RUNBOOK', 'DOC');
CREATE TYPE "AuditAction" AS ENUM ('VIEW', 'EDIT', 'COPY', 'SHARE', 'DELETE', 'CREATE');

CREATE TABLE "Membership" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'VIEWER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE ("userId", "organizationId")
);
CREATE INDEX "Membership_organizationId_idx" ON "Membership"("organizationId");

CREATE TABLE "Folder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "parentFolderId" TEXT,
    "name" TEXT NOT NULL,
    "itemType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("parentFolderId") REFERENCES "Folder"("id")
);
CREATE INDEX "Folder_organizationId_idx" ON "Folder"("organizationId");

CREATE TABLE "VaultItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "folderId" TEXT,
    "title" TEXT NOT NULL,
    "username" TEXT,
    "encryptedPassword" TEXT NOT NULL,
    "encryptionIv" TEXT NOT NULL,
    "encryptedTotp" TEXT,
    "url" TEXT,
    "notes" TEXT,
    "tags" TEXT[] NOT NULL DEFAULT '{}',
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "VaultItem_organizationId_idx" ON "VaultItem"("organizationId");

CREATE TABLE "Bookmark" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "folderId" TEXT,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "faviconUrl" TEXT,
    "tags" TEXT[] NOT NULL DEFAULT '{}',
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "Bookmark_organizationId_idx" ON "Bookmark"("organizationId");

CREATE TABLE "Document" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "folderId" TEXT,
    "title" TEXT NOT NULL,
    "docType" "DocType" NOT NULL DEFAULT 'DOC',
    "content" TEXT NOT NULL,
    "lastReviewedAt" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "Document_organizationId_idx" ON "Document"("organizationId");

CREATE TABLE "DocumentVersion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "documentId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "editedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE
);
CREATE INDEX "DocumentVersion_documentId_idx" ON "DocumentVersion"("documentId");

CREATE TABLE "Link" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "Link_organizationId_idx" ON "Link"("organizationId");

CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" "AuditAction" NOT NULL,
    "itemType" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "AuditLog_organizationId_createdAt_idx" ON "AuditLog"("organizationId", "createdAt");

CREATE TABLE "Share" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "itemType" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "token" TEXT NOT NULL UNIQUE,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "isOneTimeView" BOOLEAN NOT NULL DEFAULT false,
    "viewedAt" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
