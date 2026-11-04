/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Short commit hash of the build, set by the Dockerfile (GIT_SHA build arg).
  readonly VITE_GIT_SHA?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
