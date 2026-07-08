import type { UserRole } from "./domain";

export interface PermissionMatrix {
  subject: UserRole;
  canViewPublicContent: boolean;
  canManageOwnPortal: boolean;
  canUploadOwnDocuments: boolean;
  canViewAssignedResources: boolean;
  canSendSecureMessages: boolean;
  canViewAssignedClients: boolean;
  canReviewDocuments: boolean;
  canManageTasks: boolean;
  canUpdateClaimStages: boolean;
  canAssignResources: boolean;
  canManageProviderDirectory: boolean;
  canViewRevenue: boolean;
  canManageSystemContent: boolean;
  canAccessAllClientProfiles: boolean;
}

export const rolePermissions: Record<UserRole, PermissionMatrix> = {
  public: {
    subject: "public",
    canViewPublicContent: true,
    canManageOwnPortal: false,
    canUploadOwnDocuments: false,
    canViewAssignedResources: false,
    canSendSecureMessages: false,
    canViewAssignedClients: false,
    canReviewDocuments: false,
    canManageTasks: false,
    canUpdateClaimStages: false,
    canAssignResources: false,
    canManageProviderDirectory: false,
    canViewRevenue: false,
    canManageSystemContent: false,
    canAccessAllClientProfiles: false
  },
  client: {
    subject: "client",
    canViewPublicContent: true,
    canManageOwnPortal: true,
    canUploadOwnDocuments: true,
    canViewAssignedResources: true,
    canSendSecureMessages: true,
    canViewAssignedClients: false,
    canReviewDocuments: false,
    canManageTasks: false,
    canUpdateClaimStages: false,
    canAssignResources: false,
    canManageProviderDirectory: false,
    canViewRevenue: false,
    canManageSystemContent: false,
    canAccessAllClientProfiles: false
  },
  assistant: {
    subject: "assistant",
    canViewPublicContent: true,
    canManageOwnPortal: false,
    canUploadOwnDocuments: false,
    canViewAssignedResources: false,
    canSendSecureMessages: true,
    canViewAssignedClients: true,
    canReviewDocuments: true,
    canManageTasks: true,
    canUpdateClaimStages: true,
    canAssignResources: false,
    canManageProviderDirectory: true,
    canViewRevenue: false,
    canManageSystemContent: true,
    canAccessAllClientProfiles: false
  },
  owner: {
    subject: "owner",
    canViewPublicContent: true,
    canManageOwnPortal: false,
    canUploadOwnDocuments: false,
    canViewAssignedResources: false,
    canSendSecureMessages: true,
    canViewAssignedClients: true,
    canReviewDocuments: true,
    canManageTasks: true,
    canUpdateClaimStages: true,
    canAssignResources: true,
    canManageProviderDirectory: true,
    canViewRevenue: true,
    canManageSystemContent: true,
    canAccessAllClientProfiles: true
  }
};
