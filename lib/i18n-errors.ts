type ErrorKey =
  | "reasonRequired"
  | "cardNotLive"
  | "alreadyOwnsCard"
  | "doesNotOwnCard"
  | "invalidAmount"
  | "userNotFound"
  | "boosterNotLive"
  | "rewardUnavailable"
  | "rewardSoldOut"
  | "notEnoughPoints"
  | "boosterNotPending"
  | "viewerUnresolved"
  | "boosterInactive";

type ErrorTranslator = (key: ErrorKey) => string;

const ADMIN_ERRORS: Record<string, ErrorKey> = {
  "A reason is required": "reasonRequired",
  "Card is not in the live catalog": "cardNotLive",
  "User already owns this card": "alreadyOwnsCard",
  "User does not own this card": "doesNotOwnCard",
  "Amount must be a non-zero integer": "invalidAmount",
  "User not found": "userNotFound",
  "Booster is not in the live catalog": "boosterNotLive",
};

const REDEEM_ERRORS: Record<string, ErrorKey> = {
  "Reward is not available": "rewardUnavailable",
  "This reward is sold out": "rewardSoldOut",
  "Not enough collector points": "notEnoughPoints",
};

const DRAW_ERRORS: Record<string, ErrorKey> = {
  "Booster is not pending or was already opened": "boosterNotPending",
  "Could not resolve viewer account for this booster": "viewerUnresolved",
  "Booster type is missing or inactive": "boosterInactive",
};

function translateMapped(
  t: ErrorTranslator,
  map: Record<string, ErrorKey>,
  message: string,
) {
  const key = map[message];
  return key ? t(key) : message;
}

export function translateAdminError(t: ErrorTranslator, message: string) {
  return translateMapped(t, ADMIN_ERRORS, message);
}

export function translateRedeemError(t: ErrorTranslator, message: string) {
  return translateMapped(t, REDEEM_ERRORS, message);
}

export function translateDrawError(t: ErrorTranslator, message: string) {
  return translateMapped(t, DRAW_ERRORS, message);
}
