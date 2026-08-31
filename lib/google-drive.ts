const driveFolderId =
  process.env.GOOGLE_DRIVE_FOLDER_ID || "1zjSIzFlh8dEHVdGDZoRKWkC7vROWPG1A";

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
    return null;
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

  if (!(serviceAccount?.private_key && serviceAccount.client_email)) {
    console.warn("Google Drive integration is not configured", {
      hasServiceAccountJson: Boolean(serviceAccount),
      hasFolderId: Boolean(driveFolderId),
    });
    return null;
  }

  try {
    const { google } = await import("googleapis");

    const auth = new google.auth.GoogleAuth({
      credentials: serviceAccount,
      scopes: [
        "https://www.googleapis.com/auth/drive",
        "https://www.googleapis.com/auth/docs",
      ],
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
      return null;
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
      id: docId,
      url: file.data.webViewLink ?? undefined,
    };
  } catch (error) {
    console.error("Failed to create Google Doc for agenda meeting", error);
    return null;
  }
}
