import { Client } from '@microsoft/microsoft-graph-client';
import 'isomorphic-fetch';

// ==========================================
// MICROSOFT GRAPH CLIENT SETUP
// ==========================================

interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  // Check if we have a valid cached token
  if (cachedToken && Date.now() < cachedToken.expiresAt - 60000) {
    return cachedToken.token;
  }

  const tenantId = process.env.AZURE_AD_TENANT_ID;
  const clientId = process.env.AZURE_AD_CLIENT_ID;
  const clientSecret = process.env.AZURE_AD_CLIENT_SECRET;

  if (!tenantId || !clientId || !clientSecret) {
    throw new Error('Microsoft Azure AD credentials not configured');
  }

  const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
      scope: 'https://graph.microsoft.com/.default',
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to obtain access token');
  }

  const data: TokenResponse = await response.json();

  // Cache the token
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };

  return data.access_token;
}

export async function getGraphClient(): Promise<Client> {
  const accessToken = await getAccessToken();

  return Client.init({
    authProvider: (done) => {
      done(null, accessToken);
    },
  });
}

// ==========================================
// DRIVE OPERATIONS
// ==========================================

export interface DriveItem {
  id: string;
  name: string;
  webUrl: string;
  folder?: { childCount: number };
  file?: { mimeType: string };
  size: number;
  createdDateTime: string;
  lastModifiedDateTime: string;
  createdBy?: { user?: { displayName: string } };
  lastModifiedBy?: { user?: { displayName: string } };
}

export interface DriveInfo {
  id: string;
  name: string;
  driveType: string;
  webUrl: string;
  owner?: { user?: { displayName: string } };
}

/**
 * Get available drives (SharePoint sites/document libraries)
 */
export async function getDrives(siteId?: string): Promise<DriveInfo[]> {
  const client = await getGraphClient();

  try {
    let response;
    if (siteId) {
      response = await client.api(`/sites/${siteId}/drives`).get();
    } else {
      // Get drives from the default site
      response = await client.api('/sites/root/drives').get();
    }
    return response.value || [];
  } catch (error) {
    console.error('Error fetching drives:', error);
    throw error;
  }
}

/**
 * List contents of a folder
 */
export async function listFolderContents(
  driveId: string,
  folderId: string = 'root'
): Promise<DriveItem[]> {
  const client = await getGraphClient();

  try {
    const response = await client
      .api(`/drives/${driveId}/items/${folderId}/children`)
      .select('id,name,webUrl,folder,file,size,createdDateTime,lastModifiedDateTime,createdBy,lastModifiedBy')
      .get();

    return response.value || [];
  } catch (error) {
    console.error('Error listing folder contents:', error);
    throw error;
  }
}

/**
 * Get folder details
 */
export async function getFolderDetails(
  driveId: string,
  folderId: string
): Promise<DriveItem> {
  const client = await getGraphClient();

  try {
    const response = await client
      .api(`/drives/${driveId}/items/${folderId}`)
      .get();

    return response;
  } catch (error) {
    console.error('Error getting folder details:', error);
    throw error;
  }
}

/**
 * Create a new folder
 */
export async function createFolder(
  driveId: string,
  parentFolderId: string,
  folderName: string
): Promise<DriveItem> {
  const client = await getGraphClient();

  try {
    const response = await client
      .api(`/drives/${driveId}/items/${parentFolderId}/children`)
      .post({
        name: folderName,
        folder: {},
        '@microsoft.graph.conflictBehavior': 'rename',
      });

    return response;
  } catch (error) {
    console.error('Error creating folder:', error);
    throw error;
  }
}

/**
 * Get a shareable link for a file/folder
 */
export async function getShareLink(
  driveId: string,
  itemId: string,
  type: 'view' | 'edit' = 'view',
  scope: 'anonymous' | 'organization' = 'organization'
): Promise<string> {
  const client = await getGraphClient();

  try {
    const response = await client
      .api(`/drives/${driveId}/items/${itemId}/createLink`)
      .post({
        type,
        scope,
      });

    return response.link.webUrl;
  } catch (error) {
    console.error('Error creating share link:', error);
    throw error;
  }
}

/**
 * Search for files
 */
export async function searchFiles(
  driveId: string,
  query: string
): Promise<DriveItem[]> {
  const client = await getGraphClient();

  try {
    const response = await client
      .api(`/drives/${driveId}/root/search(q='${query}')`)
      .get();

    return response.value || [];
  } catch (error) {
    console.error('Error searching files:', error);
    throw error;
  }
}

/**
 * Get file download URL
 */
export async function getDownloadUrl(
  driveId: string,
  itemId: string
): Promise<string> {
  const client = await getGraphClient();

  try {
    const response = await client
      .api(`/drives/${driveId}/items/${itemId}`)
      .select('@microsoft.graph.downloadUrl')
      .get();

    return response['@microsoft.graph.downloadUrl'];
  } catch (error) {
    console.error('Error getting download URL:', error);
    throw error;
  }
}

/**
 * Get recent files
 */
export async function getRecentFiles(driveId: string, limit: number = 10): Promise<DriveItem[]> {
  const client = await getGraphClient();

  try {
    const response = await client
      .api(`/drives/${driveId}/recent`)
      .top(limit)
      .get();

    return response.value || [];
  } catch (error) {
    console.error('Error getting recent files:', error);
    throw error;
  }
}

// ==========================================
// PERMISSION OPERATIONS
// ==========================================

export interface DrivePermission {
  id: string;
  roles: string[];
  grantedTo?: { user?: { displayName: string; email: string } };
  grantedToIdentities?: Array<{ user?: { displayName: string; email: string } }>;
  link?: { webUrl: string; type: string; scope: string };
}

/**
 * Get permissions on an item
 */
export async function getItemPermissions(
  driveId: string,
  itemId: string
): Promise<DrivePermission[]> {
  const client = await getGraphClient();

  try {
    const response = await client
      .api(`/drives/${driveId}/items/${itemId}/permissions`)
      .get();

    return response.value || [];
  } catch (error) {
    console.error('Error getting permissions:', error);
    throw error;
  }
}

/**
 * Grant permission to a user
 */
export async function grantPermission(
  driveId: string,
  itemId: string,
  email: string,
  role: 'read' | 'write' = 'read'
): Promise<void> {
  const client = await getGraphClient();

  try {
    await client
      .api(`/drives/${driveId}/items/${itemId}/invite`)
      .post({
        requireSignIn: true,
        sendInvitation: false,
        roles: [role],
        recipients: [{ email }],
      });
  } catch (error) {
    console.error('Error granting permission:', error);
    throw error;
  }
}

/**
 * Remove a permission
 */
export async function removePermission(
  driveId: string,
  itemId: string,
  permissionId: string
): Promise<void> {
  const client = await getGraphClient();

  try {
    await client
      .api(`/drives/${driveId}/items/${itemId}/permissions/${permissionId}`)
      .delete();
  } catch (error) {
    console.error('Error removing permission:', error);
    throw error;
  }
}

// ==========================================
// HELPER FUNCTIONS
// ==========================================

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Get file icon based on mime type or extension
 */
export function getFileIcon(item: DriveItem): string {
  if (item.folder) return 'folder';

  const mimeType = item.file?.mimeType || '';
  const extension = item.name.split('.').pop()?.toLowerCase() || '';

  // Map mime types to icon names
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType.includes('pdf')) return 'pdf';
  if (mimeType.includes('word') || extension === 'doc' || extension === 'docx') return 'word';
  if (mimeType.includes('excel') || extension === 'xls' || extension === 'xlsx') return 'excel';
  if (mimeType.includes('powerpoint') || extension === 'ppt' || extension === 'pptx') return 'powerpoint';
  if (mimeType.includes('text') || extension === 'txt') return 'text';
  if (mimeType.includes('zip') || mimeType.includes('compressed')) return 'archive';

  return 'file';
}
