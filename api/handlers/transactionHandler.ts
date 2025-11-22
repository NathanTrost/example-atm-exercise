import { Pool } from "pg";
import { MAX_DAILY_WITHDRAWAL_LIMIT } from "../const/transactionLimits";
import { AppError, ErrorCode } from "../const/errors";
import { PoolClient, withClientPool } from "../utils/db";
import { getAccount } from "./accountHandler";
import { Account, TransactionType } from "../types";

/** Keep track of successful transactions so we can ensure at a later point that daily limits are not exceeded */
const createTransaction = async (
  accountID: string,
  amount: number,
  transactionType: TransactionType,
  client: PoolClient
): Promise<void> => {
  await client.query(
    `INSERT INTO transactions (account_id, type, amount, timestamp)
     VALUES ($1, $2, $3, $4)`,
    [accountID, transactionType, amount, new Date()]
  );
};

const checkDailyWithdrawalLimit = async (
  accountID: string,
  amount: number,
  client: PoolClient
): Promise<void> => {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const dailyWithdrawalRes = await client.query(
    `SELECT COALESCE(SUM(amount), 0) as total
     FROM transactions
     WHERE account_id = $1
       AND type = 'withdrawal'
       AND timestamp >= $2`,
    [accountID, startOfDay]
  );

  const dailyWithdrawalSum = Number(dailyWithdrawalRes.rows[0].total);
  const projectedSum = Number(dailyWithdrawalSum + amount);

  if (projectedSum > MAX_DAILY_WITHDRAWAL_LIMIT) {
    throw new AppError(
      ErrorCode.DAILY_WITHDRAWAL_LIMIT_EXCEEDED,
      `Daily withdrawal limit of ${MAX_DAILY_WITHDRAWAL_LIMIT} exceeded`
    );
  }
};

const validateAgainstOverdraft = (
  isCreditAccount: boolean,
  newBalance: number,
  creditLimit: number
): void => {
  const isOverdrawnFromAccount = newBalance < 0;
  if (!isOverdrawnFromAccount) {
    return;
  }
  if (isCreditAccount) {
    if (newBalance + creditLimit < 0) {
      throw new AppError(
        ErrorCode.CREDIT_LIMIT_EXCEEDED,
        "Credit limit exceeded"
      );
    }
    return;
  }

  throw new AppError(ErrorCode.INSUFFICIENT_FUNDS, "Insufficient funds");
};

export const withdrawal = async (
  accountID: string,
  amount: number
): Promise<Account> => {
  return withClientPool(async (client: PoolClient) => {
    const account = await getAccount(accountID, client);
    const isCreditAccount: boolean = account.account_type === "credit";
    const creditLimit = isCreditAccount ? account.credit_limit : 0;
    const projectedBalance = Number(account.amount) - amount;

    validateAgainstOverdraft(isCreditAccount, projectedBalance, creditLimit);

    await checkDailyWithdrawalLimit(accountID, amount, client);
    const result = await client.query(
      `UPDATE accounts
    SET amount = $1
    WHERE account_number = $2`,
      [projectedBalance, accountID]
    );
    if (result.rowCount === 0) {
      throw new AppError(
        ErrorCode.ACCOUNT_NOT_FOUND,
        "Account not found or update failed"
      );
    }

    await createTransaction(accountID, amount, "withdraw", client);
    return { ...account, amount: projectedBalance };
  });
};

const validateAgainstCreditOverpayment = (
  isCreditAccount: boolean,
  newBalance: number,
  creditLimit: number
) => {
  if (isCreditAccount) {
    if (creditLimit + newBalance > 0) {
      throw new AppError(
        ErrorCode.OVERPAYMENT_NOT_ALLOWED,
        "Overpayment is not allowed"
      );
    }
    return;
  }
  return;
};

export const deposit = async (
  accountID: string,
  amount: number
): Promise<Account> => {
  return withClientPool(async (client: PoolClient) => {
    const account = await getAccount(accountID, client);

    const isCreditAccount: boolean = account.account_type === "credit";
    const creditLimit = isCreditAccount ? account.credit_limit : 0;
    const projectedBalance = Number(account.amount) + amount;

    validateAgainstCreditOverpayment(
      isCreditAccount,
      projectedBalance,
      creditLimit
    );

    const result = await client.query(
      `UPDATE accounts
    SET amount = $1
    WHERE account_number = $2`,
      [projectedBalance, accountID]
    );

    if (result.rowCount === 0) {
      throw new AppError(
        ErrorCode.ACCOUNT_NOT_FOUND,
        "Account not found or update failed"
      );
    }

    await createTransaction(accountID, projectedBalance, "deposit", client);

    return { ...account, amount: projectedBalance };
  });
};
