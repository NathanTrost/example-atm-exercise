export enum ErrorCode {
  INVALID_INCREMENT = "INVALID_INCREMENT",
  MIN_VALUE_EXCEEDED = "MIN_VALUE_EXCEEDED",
  MAX_VALUE_EXCEEDED = "MAX_VALUE_EXCEEDED",
  INVALID_TYPE = "INVALID_TYPE",
  REQUIRED_FIELD = "REQUIRED_FIELD",
  INSUFFICIENT_FUNDS = "INSUFFICIENT_FUNDS",
  CREDIT_LIMIT_EXCEEDED = "CREDIT_LIMIT_EXCEEDED",
  DAILY_WITHDRAWAL_LIMIT_EXCEEDED = "DAILY_WITHDRAWAL_LIMIT_EXCEEDED",
  OVERPAYMENT_NOT_ALLOWED = "OVERPAYMENT_NOT_ALLOWED",
  ACCOUNT_NOT_FOUND = "ACCOUNT_NOT_FOUND",
  VALIDATION_ERROR = "VALIDATION_ERROR",
}

export class AppError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = "AppError";
  }
}

export const JoiErrorMap: Record<string, ErrorCode> = {
  "number.multiple": ErrorCode.INVALID_INCREMENT,
  "number.min": ErrorCode.MIN_VALUE_EXCEEDED,
  "number.max": ErrorCode.MAX_VALUE_EXCEEDED,
  "number.base": ErrorCode.INVALID_TYPE,
  "any.required": ErrorCode.REQUIRED_FIELD,
};
