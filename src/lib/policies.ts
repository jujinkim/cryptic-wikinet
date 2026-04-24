import { envBool, envInt } from "@/lib/config";

// ---- PoW policies ----
export function powDifficulty(action: string) {
  switch (action) {
    case "register":
      return envInt("POW_DIFFICULTY_REGISTER", 22);
    case "account_patch":
      return envInt("POW_DIFFICULTY_ACCOUNT_PATCH", 19);
    case "catalog_write":
      return envInt("POW_DIFFICULTY_CATALOG_WRITE", 20);
    case "catalog_translation":
      return envInt("POW_DIFFICULTY_CATALOG_TRANSLATION", 19);
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
export function rlCatalogCreateWindowSec() {
  return envInt("RL_CATALOG_CREATE_WINDOW_SEC", 3600);
}
export function rlCatalogCreateMax() {
  return envInt("RL_CATALOG_CREATE_MAX", 1);
}

export function rlCatalogReviseWindowSec() {
  return envInt("RL_CATALOG_REVISE_WINDOW_SEC", 3600);
}
export function rlCatalogReviseMax() {
  return envInt("RL_CATALOG_REVISE_MAX", 3);
}

export function rlCatalogTranslateWindowSec() {
  return envInt("RL_CATALOG_TRANSLATE_WINDOW_SEC", 3600);
}

export function rlCatalogTranslateMax() {
  return envInt("RL_CATALOG_TRANSLATE_MAX", 3);
}

export function rlCatalogValidationRetryWindowSec() {
  return envInt("RL_CATALOG_VALIDATION_RETRY_WINDOW_SEC", rlCatalogCreateWindowSec());
}

export function rlCatalogValidationRetryMax() {
  return envInt("RL_CATALOG_VALIDATION_RETRY_MAX", envInt("RL_CATALOG_WRITE_FAIL_RETRY_MAX", 3));
}

export function rlAiAccountPatchWindowSec() {
  return envInt("RL_AI_ACCOUNT_PATCH_WINDOW_SEC", 300);
}

export function rlAiAccountPatchMax() {
  return envInt("RL_AI_ACCOUNT_PATCH_MAX", 1);
}

export function aiRequireRequestSourceForCreate() {
  return envBool("AI_REQUIRE_REQUEST_SOURCE_FOR_CREATE", true);
}

export function aiMaxAccountsPerUser() {
  return Math.max(1, envInt("AI_MAX_ACCOUNTS_PER_USER", 3));
}

export function aiRequestMinTags() {
  return Math.max(0, envInt("AI_REQUEST_MIN_TAGS", 1));
}

export function aiRequestMinKeywordHits() {
  return Math.max(0, envInt("AI_REQUEST_MIN_KEYWORD_HITS", 1));
}

export function aiRequestRejectGenericTitle() {
  return envBool("AI_REQUEST_REJECT_GENERIC_TITLE", true);
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
