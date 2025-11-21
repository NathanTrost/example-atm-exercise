export const MAX_DAILY_WITHDRAWAL_LIMIT = 400;
export const MAX_INDIVIDUAL_WITHDRAWAL_LIMIT = 200;
export const WITHDRAWAL_INCREMENT = 5;

export const MAX_INDIVIDUAL_DEPOSIT = 1000;
export const MIN_INDIVIDUAL_DEPOSIT = 0.01;

// Mapped to Joi error types
export const TRANSACTION_ERROR_CODES: Record<string, string> = {
  "number.multiple": "INVALID_INCREMENT",
  "number.min": "MIN_VALUE_EXCEEDED",
  "number.max": "MAX_VALUE_EXCEEDED",
  "number.base": "INVALID_TYPE",
  "any.required": "REQUIRED_FIELD",

  // NOTE: Will need to remove, saving this for now for memory based logic
  //   INSUFFICIENT_FUNDS: {
  //     code: "INSUFFICIENT_FUNDS",
  //     message: "You do not have sufficient funds for this withdrawal",
  //   },

  //   MAX_DEPOSIT_VALUE_EXCEEDED: {
  //     code: "MAX_DEPOSIT_VALUE_EXCEEDED",
  //     message: "",
  //   },

  //   DAILY_LIMIT_EXCEEDED: {
  //     code: "DAILY_LIMIT_EXCEEDED",
  //     message: `Daily withdrawal limit of $${MAX_DAILY_WITHDRAWAL_LIMIT} exceeded`,
  //   },
  //   DEPOSIT_LIMIT_EXCEEDED: {
  //     code: "DEPOSIT_LIMIT_EXCEEDED",
  //     message: `Single deposit cannot exceed $${MAX_INDIVIDUAL_DEPOSIT}`,
  //   },
};
