import express, { Request, Response } from "express";
import Joi, { Schema } from "joi";
import { deposit, withdrawal } from "../handlers/transactionHandler";
import {
  MAX_INDIVIDUAL_DEPOSIT,
  MAX_INDIVIDUAL_WITHDRAWAL_LIMIT,
  MIN_INDIVIDUAL_DEPOSIT,
  WITHDRAWAL_INCREMENT,
  TRANSACTION_ERROR_CODES,
} from "../const/transactionLimits";

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
      return response.status(400).json({
        error: error.details[0].message,
        code: TRANSACTION_ERROR_CODES[errorType] || "VALIDATION_ERROR",
      });
    }

    try {
      const updatedAccount = await withdrawal(
        request.params.accountID,
        request.body.amount
      );
      return response.status(200).json(updatedAccount);
    } catch (err) {
      if (err instanceof Error) {
        console.error("Withdrawal error:", err);
        return response.status(400).json({
          error: err.message,
          // NOTE: Will remove when done
          debug: {
            accountID: request.params.accountID,
            amount: request.body.amount,
            amountType: typeof request.body.amount,
          },
        });
      }
    }
  }
);

router.put(
  "/:accountID/deposit",
  async (request: Request, response: Response) => {
    const { error } = depositTransactionSchema.validate(request.body);

    if (error) {
      const errorType = error.details[0].type;
      return response.status(400).json({
        error: error.details[0].message,
        code: TRANSACTION_ERROR_CODES[errorType] || "VALIDATION_ERROR",
      });
    }

    try {
      const updatedAccount = await deposit(
        request.params.accountID,
        request.body.amount
      );
      return response.status(200).json(updatedAccount);
    } catch (err) {
      if (err instanceof Error) {
        console.error("Deposit error:", err);
        return response.status(400).json({
          error: err.message,
          // NOTE: Will remove when done
          debug: {
            accountID: request.params.accountID,
            amount: request.body.amount,
            amountType: typeof request.body.amount,
          },
        });
      }
    }
  }
);

export default router;
