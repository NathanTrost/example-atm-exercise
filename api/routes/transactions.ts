import express, { Request, Response } from "express";
import Joi, { Schema } from "joi";
import { deposit, withdrawal } from "../handlers/transactionHandler";
import {
  MAX_INDIVIDUAL_DEPOSIT,
  MAX_INDIVIDUAL_WITHDRAWAL_LIMIT,
  MIN_INDIVIDUAL_DEPOSIT,
  WITHDRAWAL_INCREMENT,
} from "../const/transactionLimits";
import { AppError, ErrorCode, JoiErrorMap } from "../const/errors";

const router = express.Router();

const depositTransactionSchema: Schema = Joi.object({
  amount: Joi.number()
    .min(MIN_INDIVIDUAL_DEPOSIT)
    .max(MAX_INDIVIDUAL_DEPOSIT)
    .required()
    .messages({
      "number.min":
        "Deposit '{#key} must exceed ${#limit}. Received ${#value}.",
      "number.max":
        "Deposit '{#key} must not exceed ${#limit}. Received ${#value}.",
      "any.required": "Deposit '{#key} field is required.",
    }),
});

const withdrawalTransactionSchema: Schema = Joi.object({
  amount: Joi.number()
    .multiple(WITHDRAWAL_INCREMENT)
    .min(WITHDRAWAL_INCREMENT)
    .max(MAX_INDIVIDUAL_WITHDRAWAL_LIMIT)
    .required()
    .label("Withdrawal 'amount'")
    .messages({
      "number.multiple":
        "Withdrawal '{#key} must be in ${#base} increments. Received ${#value}.",
      "number.min":
        "Withdrawal '{#key} must exceed ${#limit}. Received ${#value}.",
      "number.max":
        "Withdrawal '{#key} must not exceed ${#limit}. Received ${#value}.",
      "any.required": "Withdrawal '{#key}' field is required.",
    }),
});

router.put(
  "/:accountID/withdraw",
  async (request: Request, response: Response) => {
    const { error } = withdrawalTransactionSchema.validate(request.body);

    if (error) {
      const errorType = error.details[0].type;
      const code = JoiErrorMap[errorType] || ErrorCode.VALIDATION_ERROR;
      return response.status(400).json({
        error: error.details[0].message,
        code,
      });
    }

    try {
      const updatedAccount = await withdrawal(
        request.params.accountID,
        request.body.amount
      );
      return response.status(200).json(updatedAccount);
    } catch (err) {
      if (err instanceof AppError) {
        console.error("Withdrawal error:", err);
        return response.status(err.statusCode).json({
          error: err.message,
          code: err.code,
        });
      }
      console.error("Unexpected withdrawal error:", err);
      console.error("Error type:", typeof err);
      console.error("Error constructor:", err?.constructor?.name);
      if (err instanceof Error) {
        console.error("Error message:", err.message);
        console.error("Error stack:", err.stack);
      } else {
        console.error("Non-Error thrown:", err);
      }
      return response.status(500).json({
        error: "Internal server error",
        code: ErrorCode.VALIDATION_ERROR,
      });
    }
  }
);

router.put(
  "/:accountID/deposit",
  async (request: Request, response: Response) => {
    const { error } = depositTransactionSchema.validate(request.body);

    if (error) {
      const errorType = error.details[0].type;
      const code = JoiErrorMap[errorType] || ErrorCode.VALIDATION_ERROR;
      return response.status(400).json({
        error: error.details[0].message,
        code,
      });
    }

    try {
      const updatedAccount = await deposit(
        request.params.accountID,
        request.body.amount
      );

      return response.status(200).json(updatedAccount);
    } catch (err) {
      if (err instanceof AppError) {
        console.error("Deposit error:", err);
        return response.status(err.statusCode).json({
          error: err.message,
          code: err.code,
        });
      }
      console.error("Unexpected deposit error:", err);
      console.error("Error type:", typeof err);
      console.error("Error constructor:", err?.constructor?.name);
      if (err instanceof Error) {
        console.error("Error message:", err.message);
        console.error("Error stack:", err.stack);
      } else {
        console.error("Non-Error thrown:", err);
      }
      return response.status(500).json({
        error: "Internal server error",
        code: ErrorCode.VALIDATION_ERROR,
      });
    }
  }
);

export default router;
