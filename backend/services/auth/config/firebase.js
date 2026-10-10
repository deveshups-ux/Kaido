import { initializeApp, cert, getApps } from "firebase-admin/app";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let serviceAccount = null;

// 1. Check Environment Variable
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

// 2. Check Multiple Secret File Paths
if (!serviceAccount) {
  const possiblePaths = [
    "/etc/secrets/serviceAccountKey.json", // Render default secret path
    path.join(process.cwd(), "serviceAccountKey.json"), // App root
    path.join(__dirname, "../serviceAccountKey.json"), // Local dev path
    path.join(__dirname, "../../serviceAccountKey.json"),
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      try {
        serviceAccount = JSON.parse(fs.readFileSync(p, "utf-8"));
        break;
      } catch (e) {
        console.error(`Failed to read ${p}:`, e);
      }
    }
  }
}

export const app =
  getApps().length > 0
    ? getApps()[0]
    : initializeApp({
        credential: serviceAccount ? cert(serviceAccount) : undefined,
      });
