import {
  MAX_DAILY_WITHDRAWAL_LIMIT,
  WITHDRAWAL_INCREMENT,
} from "../const/transactionLimits";
import { AppError, ErrorCode } from "../const/errors";
import { PoolClient, withClientPool } from "../utils/db";
import { getAccount } from "./accountHandler";
import { Account, TransactionType } from "../types";

/** Create log as reference to ensure at a later point that daily limits are not exceeded */
const createTransactionLog = async (
  accountId: string,
  amount: number,
  transactionType: TransactionType,
  client: PoolClient
): Promise<void> => {
  await client.query(
    `INSERT INTO transactions (account_id, type, amount, timestamp)
     VALUES ($1, $2, $3, $4)`,
    [accountId, transactionType, amount, new Date()]
  );
};

const checkDailyWithdrawalLimit = async (
  accountId: string,
  amount: number,
  client: PoolClient
): Promise<void> => {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const dailyWithdrawalRes = await client.query(
    `SELECT COALESCE(SUM(amount), 0) as total
     FROM transactions
     WHERE account_id = $1
       AND type = 'withdraw'
       AND timestamp >= $2`,
    [accountId, startOfDay]
  );

  const dailyWithdrawalSum = Number(dailyWithdrawalRes.rows[0].total);
  const projectedSum = Number(dailyWithdrawalSum + amount);

  if (projectedSum > MAX_DAILY_WITHDRAWAL_LIMIT) {
    const remainingWithdrawalLimit =
      MAX_DAILY_WITHDRAWAL_LIMIT - dailyWithdrawalSum;
    throw new AppError(
      ErrorCode.DAILY_WITHDRAWAL_LIMIT_EXCEEDED,
      `Daily withdrawal limit of ${MAX_DAILY_WITHDRAWAL_LIMIT} exceeded. 
      You can only withdraw $${remainingWithdrawalLimit}.`,
      400,
      { remainingLimit: remainingWithdrawalLimit }
    );
  }
};

const validateAgainstOverdraft = (
  isCreditAccount: boolean,
  projectedBalance: number,
  creditLimit: number,
  currentAmount: number
): void => {
  const isOverdrawnFromAccount = projectedBalance < 0;
  if (!isOverdrawnFromAccount) {
    return;
  }
  if (isCreditAccount) {
    const projectedAvailableCredit = projectedBalance + creditLimit;
    if (projectedAvailableCredit < 0) {
      const remainingAvailableCredit = creditLimit + currentAmount;

      throw new AppError(
        ErrorCode.CREDIT_LIMIT_EXCEEDED,
        `Credit limit exceeded. You can withdraw up to $${remainingAvailableCredit}.`,
        400,
        { remainingAvailableCredit }
      );
    }
    return;
  }

  throw new AppError(ErrorCode.INSUFFICIENT_FUNDS, "Insufficient funds.");
};

export const withdrawal = async (
  accountNumber: string,
  amount: number
): Promise<Account> => {
  return withClientPool(async (client: PoolClient) => {
    const account = await getAccount(accountNumber, client);
    const isCreditAccount: boolean = account.type === "credit";
    const creditLimit = isCreditAccount ? account.credit_limit : 0;
    const projectedBalance = Number(account.amount) - amount;

    validateAgainstOverdraft(
      isCreditAccount,
      projectedBalance,
      creditLimit,
      Number(account.amount)
    );

    await checkDailyWithdrawalLimit(account.id, amount, client);
    const result = await client.query(
      `UPDATE accounts
    SET amount = $1
    WHERE id = $2`,
      [projectedBalance, account.id]
    );
    if (result.rowCount === 0) {
      throw new AppError(
        ErrorCode.ACCOUNT_NOT_FOUND,
        "Account not found or update failed."
      );
    }

    await createTransactionLog(account.id, amount, "withdraw", client);
    return { ...account, amount: Math.round(projectedBalance * 100) / 100 };
  });
};

const validateAgainstCreditOverpayment = (
  isCreditAccount: boolean,
  newBalance: number
) => {
  if (isCreditAccount) {
    if (newBalance > 0) {
      throw new AppError(
        ErrorCode.OVERPAYMENT_NOT_ALLOWED,
        "Overpayment of limit is not allowed for credit accounts."
      );
    }
    return;
  }
  return;
};

export const deposit = async (
  accountNumber: string,
  amount: number
): Promise<Account> => {
  return withClientPool(async (client: PoolClient) => {
    const account = await getAccount(accountNumber, client);

    const isCreditAccount: boolean = account.type === "credit";
    const projectedBalance = Number(account.amount) + amount;

    validateAgainstCreditOverpayment(isCreditAccount, projectedBalance);

    const result = await client.query(
      `UPDATE accounts
    SET amount = $1
    WHERE id = $2`,
      [projectedBalance, account.id]
    );

    if (result.rowCount === 0) {
      throw new AppError(
        ErrorCode.ACCOUNT_NOT_FOUND,
        "Account not found or update failed."
      );
    }

    await createTransactionLog(account.id, amount, "deposit", client);

    return { ...account, amount: Math.round(projectedBalance * 100) / 100 };
  });
};
