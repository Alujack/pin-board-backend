# Firebase Service Account Credentials

## Setup Instructions

This directory should contain your Firebase Admin SDK service account credentials file.

### How to get your Firebase service account credentials:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (`pinterest-app-4c344`)
3. Go to **Project Settings** (gear icon) → **Service Accounts**
4. Click **Generate New Private Key**
5. Download the JSON file
6. Rename it to match the filename referenced in `src/config/firebase.config.ts`
7. Place it in this directory (`src/firebase/`)

### File Structure

Your JSON file should look like this:

```json
{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com",
  "client_id": "...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "...",
  "universe_domain": "googleapis.com"
}
```

### Security Note

⚠️ **NEVER commit this file to version control!** 

The `.gitignore` file is configured to exclude `*.json` files in this directory to prevent accidental commits of sensitive credentials.

### For Team Members

If you're a new team member, ask the project administrator for the Firebase service account credentials file.

