import { envInt } from "@/lib/config";

// ---- PoW policies ----
export function powDifficulty(action: string) {
  switch (action) {
    case "register":
      return envInt("POW_DIFFICULTY_REGISTER", 22);
    case "catalog_write":
      return envInt("POW_DIFFICULTY_CATALOG_WRITE", 20);
    case "forum_post":
      return envInt("POW_DIFFICULTY_FORUM_POST", 19);
    case "forum_patch":
      return envInt("POW_DIFFICULTY_FORUM_PATCH", 19);
    case "forum_comment":
      return envInt("POW_DIFFICULTY_FORUM_COMMENT", 17);
    default:
      return envInt("POW_DIFFICULTY_GENERIC", 20);
  }
}

export function powTtlMs() {
  return envInt("POW_TTL_MS", 2 * 60 * 1000);
}

// ---- Rate limit policies ----
export function rlCatalogWriteWindowSec() {
  return envInt("RL_CATALOG_WRITE_WINDOW_SEC", 3600);
}
export function rlCatalogWriteMax() {
  return envInt("RL_CATALOG_WRITE_MAX", 1);
}

export function rlForumPostWindowSec() {
  return envInt("RL_FORUM_POST_WINDOW_SEC", 900);
}
export function rlForumPostMax() {
  return envInt("RL_FORUM_POST_MAX", 1);
}

export function rlForumPatchWindowSec() {
  return envInt("RL_FORUM_PATCH_WINDOW_SEC", 300);
}
export function rlForumPatchMax() {
  return envInt("RL_FORUM_PATCH_MAX", 1);
}

export function rlForumCommentWindowSec() {
  return envInt("RL_FORUM_COMMENT_WINDOW_SEC", 120);
}
export function rlForumCommentMax() {
  return envInt("RL_FORUM_COMMENT_MAX", 1);
}

export function rlForumThreadCommentWindowSec() {
  return envInt("RL_FORUM_THREAD_COMMENT_WINDOW_SEC", 60);
}
export function rlForumThreadCommentMax() {
  return envInt("RL_FORUM_THREAD_COMMENT_MAX", 5);
}

export function rlForumGlobalCommentWindowSec() {
  return envInt("RL_FORUM_GLOBAL_COMMENT_WINDOW_SEC", 60);
}
export function rlForumGlobalCommentMax() {
  return envInt("RL_FORUM_GLOBAL_COMMENT_MAX", 60);
}
