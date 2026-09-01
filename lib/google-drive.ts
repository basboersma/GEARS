const rootDriveFolderId =
  process.env.GOOGLE_DRIVE_FOLDER_ID || "1zjSIzFlh8dEHVdGDZoRKWkC7vROWPG1A";
const impersonatedUserEmail =
  process.env.GOOGLE_IMPERSONATED_USER_EMAIL?.trim() || undefined;

const UNCONFIGURED_MESSAGE =
  "Google Drive integration is not configured. Add GOOGLE_SERVICE_ACCOUNT_JSON and verify the service account email is valid.";

function parseServiceAccountJson() {
  const rawJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;

  if (!rawJson) {
    return null;
  }

  try {
    return JSON.parse(rawJson) as {
      client_email?: string;
      private_key?: string;
    };
  } catch (error) {
    console.error("Invalid GOOGLE_SERVICE_ACCOUNT_JSON config", error);
    return {
      error:
        "GOOGLE_SERVICE_ACCOUNT_JSON is invalid JSON. Check the downloaded service account file and make sure it is pasted as a valid JSON string.",
    };
  }
}

async function getDriveClients() {
  const serviceAccount = parseServiceAccountJson();

  if (!serviceAccount) {
    console.warn(UNCONFIGURED_MESSAGE, {
      hasFolderId: Boolean(rootDriveFolderId),
    });
    return { error: UNCONFIGURED_MESSAGE } as const;
  }

  if ("error" in serviceAccount) {
    return { error: serviceAccount.error } as const;
  }

  if (!(serviceAccount.private_key && serviceAccount.client_email)) {
    console.warn(UNCONFIGURED_MESSAGE, {
      hasServiceAccountJson: Boolean(serviceAccount),
      hasFolderId: Boolean(rootDriveFolderId),
    });
    return { error: UNCONFIGURED_MESSAGE } as const;
  }

  const { google } = await import("googleapis");

  // Impersonate a real Workspace user so files count against their Drive storage, not the service account's.
  const auth = new google.auth.JWT({
    email: serviceAccount.client_email,
    key: serviceAccount.private_key,
    scopes: [
      "https://www.googleapis.com/auth/drive",
      "https://www.googleapis.com/auth/docs",
    ],
    subject: impersonatedUserEmail,
  });

  return {
    drive: google.drive({ version: "v3", auth }),
    docs: google.docs({ version: "v1", auth }),
  } as const;
}

type DriveClient = Exclude<
  Awaited<ReturnType<typeof getDriveClients>>,
  { error: string }
>["drive"];

async function createFolder({
  name,
  parentFolderId,
  drive,
}: {
  name: string;
  parentFolderId: string;
  drive: DriveClient;
}) {
  const folder = await drive.files.create({
    requestBody: {
      name,
      mimeType: "application/vnd.google-apps.folder",
      parents: [parentFolderId],
    },
    supportsAllDrives: true,
    fields: "id,webViewLink",
  });

  return folder.data;
}

const ORGANIZATION_SUBFOLDER_NAMES = [
  "Strikes",
  "Meetings",
  "Items",
  "Invoices",
] as const;

export async function createOrganizationDriveFolders({
  name,
}: {
  name: string;
}) {
  const clients = await getDriveClients();

  if ("error" in clients) {
    return { success: false as const, error: clients.error };
  }

  const { drive } = clients;

  try {
    const rootFolder = await createFolder({
      name,
      parentFolderId: rootDriveFolderId,
      drive,
    });

    if (!rootFolder.id) {
      return {
        success: false as const,
        error:
          "Google Drive created the organization folder without an ID. Please check the folder permissions and API access.",
      };
    }

    const subfolderIds = new Map<string, string>();

    for (const subfolderName of ORGANIZATION_SUBFOLDER_NAMES) {
      const subfolder = await createFolder({
        name: subfolderName,
        parentFolderId: rootFolder.id,
        drive,
      });

      if (subfolder.id) {
        subfolderIds.set(subfolderName, subfolder.id);
      }
    }

    return {
      success: true as const,
      folderId: rootFolder.id,
      meetingsFolderId: subfolderIds.get("Meetings"),
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown Google Drive error";

    console.error("Failed to create Google Drive folders for organization", {
      message,
      name,
      error,
    });

    return {
      success: false as const,
      error: `Google Drive folder creation failed. Check that the service account has access to the shared root folder. Details: ${message}`,
    };
  }
}

export async function createMeetingFolder({
  title,
  parentFolderId,
}: {
  title: string;
  parentFolderId: string;
}) {
  const clients = await getDriveClients();

  if ("error" in clients) {
    return { success: false as const, error: clients.error };
  }

  const { drive } = clients;

  try {
    const folder = await createFolder({
      name: `${title} ${new Date().toISOString()}`,
      parentFolderId,
      drive,
    });

    if (!folder.id) {
      return {
        success: false as const,
        error:
          "Google Drive created the meeting folder without an ID. Please check the folder permissions and API access.",
      };
    }

    return {
      success: true as const,
      id: folder.id,
      url: folder.webViewLink ?? undefined,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown Google Drive error";

    console.error("Failed to create Google Drive folder for meeting", {
      message,
      parentFolderId,
      error,
    });

    return {
      success: false as const,
      error: `Google Drive meeting folder creation failed. Details: ${message}`,
    };
  }
}

export async function createMeetingDocument({
  title,
  description,
  parentFolderId,
}: {
  title: string;
  description: string;
  parentFolderId?: string;
}) {
  const clients = await getDriveClients();

  if ("error" in clients) {
    return { success: false as const, error: clients.error };
  }

  const { drive, docs } = clients;

  try {
    const file = await drive.files.create({
      requestBody: {
        name: title,
        mimeType: "application/vnd.google-apps.document",
        parents: [parentFolderId || rootDriveFolderId],
      },
      supportsAllDrives: true,
      fields: "id,webViewLink",
    });

    const docId = file.data.id;

    if (!docId) {
      return {
        success: false as const,
        error:
          "Google Drive created the file response without an ID. Please check the folder permissions and API access.",
      };
    }

    await docs.documents.batchUpdate({
      documentId: docId,
      requestBody: {
        requests: [
          {
            insertText: {
              location: { index: 1 },
              text: `${description}\n`,
            },
          },
        ],
      },
    });

    return {
      success: true as const,
      id: docId,
      url: file.data.webViewLink ?? undefined,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown Google Drive error";

    const hint =
      "Google Drive document creation failed. Check that the service account has Editor access to the shared folder and that the folder ID is valid.";

    console.error("Failed to create Google Doc for agenda meeting", {
      message,
      folderId: parentFolderId || rootDriveFolderId,
      error,
    });

    return {
      success: false as const,
      error: `${hint} Details: ${message}`,
    };
  }
}
