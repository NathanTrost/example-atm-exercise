import { Pool } from "pg";
import { MAX_DAILY_WITHDRAWAL_LIMIT } from "../const/transactionLimits";
import { PoolClient, withTransaction } from "../utils/db";
import { getAccount } from "./accountHandler";
import { Account, TransactionType } from "../types";

const checkDailyWithdrawalLimit = async (
  client: PoolClient,
  accountID: string,
  amount: number
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
    throw new Error(
      `Daily withdrawal limit of ${MAX_DAILY_WITHDRAWAL_LIMIT} exceeded`
    );
  }
};

const makeWithdrawal = async (
  client: PoolClient,
  accountID: string,
  updatedAmount: number
): Promise<void> => {
  const result = await client.query(
    `UPDATE accounts
    SET amount = $1 
    WHERE account_number = $2`,
    [updatedAmount, accountID]
  );
  if (result.rowCount === 0) {
    throw new Error("Account not found or update failed");
  }
};

const createTransaction = async (
  client: PoolClient,
  accountID: string,
  amount: number,
  transactionType: TransactionType
): Promise<void> => {
  await client.query(
    `INSERT INTO transactions (account_id, type, amount, timestamp) 
     VALUES ($1, $2, $3, $4)`,
    [accountID, transactionType, amount, new Date()]
  );
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
      throw new Error("Credit limit exceeded");
    }
    return;
  }

  throw Error("Insufficient funds");
};

export const withdrawal = async (
  accountID: string,
  amount: number
): Promise<Account> => {
  return withTransaction(async (client: PoolClient) => {
    const account = await getAccount(client, accountID);
    const isCreditAccount: boolean = account.account_type === "credit";
    const creditLimit = isCreditAccount ? account.credit_limit : 0;
    const projectedBalance = Number(account.amount) - amount;

    validateAgainstOverdraft(isCreditAccount, projectedBalance, creditLimit);

    await checkDailyWithdrawalLimit(client, accountID, amount);
    await makeWithdrawal(client, accountID, projectedBalance);

    await createTransaction(client, accountID, amount, "withdraw");
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
      throw new Error("Overpayment is not allowed");
    }
    return;
  }
  return;
};

const makeDeposit = async (
  client: PoolClient,
  accountID: string,
  updatedAmount: number
): Promise<void> => {
  const result = await client.query(
    `UPDATE accounts
    SET amount = $1 
    WHERE account_number = $2`,
    [updatedAmount, accountID]
  );

  if (result.rowCount === 0) {
    throw new Error("Account not found or update failed");
  }
};

export const deposit = async (
  accountID: string,
  amount: number
): Promise<Account> => {
  return withTransaction(async (client: PoolClient) => {
    const account = await getAccount(client, accountID);

    const isCreditAccount: boolean = account.account_type === "credit";
    const creditLimit = isCreditAccount ? account.credit_limit : 0;
    const projectedBalance = Number(account.amount) + amount;

    validateAgainstCreditOverpayment(
      isCreditAccount,
      projectedBalance,
      creditLimit
    );
    await makeDeposit(client, accountID, projectedBalance);
    await createTransaction(client, accountID, projectedBalance, "deposit");

    return { ...account, amount: projectedBalance };
  });
};
