# Firebase PDF Generation Function

This directory contains a Firebase Cloud Function that generates PDF invoices using Puppeteer. This approach is necessary because Vercel's hobby plan doesn't support Puppeteer execution.

## Prerequisites

1. Create a Firebase project at [https://console.firebase.google.com/](https://console.firebase.google.com/)
2. Install Firebase CLI globally: `npm install -g firebase-tools`
3. Log in to Firebase: `firebase login`
4. Initialize your Firebase project: `firebase use --add` and select your Firebase project

## Configuration

1. Create a `.env.local` file in your project root with the following Firebase configuration (copy from the `.env.local.example` file):

```
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id

# Firebase Admin Configuration
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account-email@your-project-id.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour Private Key Here\n-----END PRIVATE KEY-----\n"
```

2. You can get these values from:
   - Firebase Console > Project Settings > General tab (for public values)
   - Firebase Console > Project Settings > Service Accounts > Generate new private key (for admin values)

## Deployment

1. Install dependencies: `cd functions && npm install`
2. Build the function: `npm run build`
3. Deploy the function: `firebase deploy --only functions`

## Usage

The Firebase function will be automatically used as a fallback in the Next.js application when the API route fails to generate a PDF directly.

## Function Details

- The function uses Puppeteer to render HTML as PDF
- It has a 5-minute timeout and 1GB of memory
- The function expects invoice data, HTML template, and other parameters
- It returns a base64-encoded PDF that the client can render

## Troubleshooting

If you encounter issues with PDF generation:

1. Check Firebase Cloud Function logs in the Firebase Console
2. Ensure your service account has appropriate permissions
3. Verify that your HTML template is accessible
4. Make sure all required data is being sent to the function
