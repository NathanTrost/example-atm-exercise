import express, { Request, Response } from "express";
import Joi, { Schema } from "joi";
import { getAccount } from "../handlers/accountHandler";
import { AppError, ErrorCode, JoiErrorMap } from "../const/errors";

const router = express.Router();

const getAccountSchema: Schema = Joi.string().required();

router.get("/:accountNumber", async (request: Request, response: Response) => {
  const { error } = getAccountSchema.validate(request.params.accountNumber);

  if (error) {
    const errorType = error.details[0].type;
    const code = JoiErrorMap[errorType] || ErrorCode.VALIDATION_ERROR;
    return response.status(400).json({
      error: error.details[0].message,
      code,
    });
  }

  try {
    const account = await getAccount(request.params.accountNumber);
    response.json(account);
  } catch (err) {
    if (err instanceof AppError) {
      return response.status(err.statusCode).json({
        error: err.message,
        code: err.code,
      });
    }
    console.error("Unexpected account error:", err);
    if (err instanceof Error) {
      console.error("Error details:", err.message, err.stack);
    }
    return response.status(404).json({
      error: "Account not found.",
      code: ErrorCode.ACCOUNT_NOT_FOUND,
    });
  }
});

export default router;
