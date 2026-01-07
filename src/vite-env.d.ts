/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AZURE_VISION_ENDPOINT: string
  readonly VITE_AZURE_VISION_KEY: string
  readonly VITE_AZURE_MAPS_KEY: string
  readonly VITE_AZURE_CLIENT_ID: string
  readonly VITE_AZURE_CLIENT_SECRET: string
  readonly VITE_AZURE_TENANT_ID: string
  readonly VITE_COSMOS_ENDPOINT: string
  readonly VITE_COSMOS_KEY: string
  readonly VITE_POWERBI_CLIENT_ID: string
  readonly VITE_STATIC_WEB_APP_URL: string
  readonly VITE_FIREBASE_API_KEY: string
  readonly VITE_FIREBASE_AUTH_DOMAIN: string
  readonly VITE_FIREBASE_PROJECT_ID: string
  readonly VITE_FIREBASE_STORAGE_BUCKET: string
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID: string
  readonly VITE_FIREBASE_APP_ID: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
