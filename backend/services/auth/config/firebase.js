import { initializeApp, cert, getApps } from "firebase-admin/app";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let serviceAccount = null;

if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    if (serviceAccount.private_key) {
      serviceAccount.private_key = serviceAccount.private_key.replace(
        /\\n/g,
        "\n",
      );
    }
  } catch (e) {
    console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT env var:", e);
  }
}

if (!serviceAccount) {
  const keyPath = path.join(__dirname, "../serviceAccountKey.json");
  if (fs.existsSync(keyPath)) {
    try {
      serviceAccount = JSON.parse(fs.readFileSync(keyPath, "utf-8"));
    } catch (e) {
      console.error("Failed to read serviceAccountKey.json:", e);
    }
  }
}

export const app =
  getApps().length > 0
    ? getApps()[0]
    : initializeApp({
        credential: serviceAccount ? cert(serviceAccount) : undefined,
      });
