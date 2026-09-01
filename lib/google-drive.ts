const driveFolderId =
  process.env.GOOGLE_DRIVE_FOLDER_ID || "1zjSIzFlh8dEHVdGDZoRKWkC7vROWPG1A";
const impersonatedUserEmail =
  process.env.GOOGLE_IMPERSONATED_USER_EMAIL?.trim() || undefined;

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

export async function createMeetingDocument({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  const serviceAccount = parseServiceAccountJson();

  if (!serviceAccount) {
    const errorMessage =
      "Google Drive integration is not configured. Add GOOGLE_SERVICE_ACCOUNT_JSON and verify the service account email is valid.";

    console.warn(errorMessage, {
      hasFolderId: Boolean(driveFolderId),
    });

    return {
      success: false,
      error: errorMessage,
    };
  }

  if ("error" in serviceAccount) {
    return {
      success: false,
      error: serviceAccount.error,
    };
  }

  if (!(serviceAccount.private_key && serviceAccount.client_email)) {
    const errorMessage =
      "Google Drive integration is not configured. Add GOOGLE_SERVICE_ACCOUNT_JSON and verify the service account email is valid.";

    console.warn(errorMessage, {
      hasServiceAccountJson: Boolean(serviceAccount),
      hasFolderId: Boolean(driveFolderId),
    });

    return {
      success: false,
      error: errorMessage,
    };
  }

  try {
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

    const drive = google.drive({ version: "v3", auth });
    const docs = google.docs({ version: "v1", auth });

    const file = await drive.files.create({
      requestBody: {
        name: title,
        mimeType: "application/vnd.google-apps.document",
        parents: [driveFolderId],
      },
      supportsAllDrives: true,
      fields: "id,webViewLink",
    });

    const docId = file.data.id;

    if (!docId) {
      return {
        success: false,
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
      success: true,
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
      folderId: driveFolderId,
      error,
    });

    return {
      success: false,
      error: `${hint} Details: ${message}`,
    };
  }
}
