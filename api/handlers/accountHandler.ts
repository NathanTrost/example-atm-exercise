import { PoolClient, query } from "../utils/db";
import { AppError, ErrorCode } from "../const/errors";

export const getAccount = async (accountID: string, client?: PoolClient) => {
  // Since we're using a pool that allows for us to revert our update on transactions, making
  // the query method dynamic as pool is not needed for simple login
  const res = client
    ? await client.query(
        `SELECT account_number, name, amount, type, credit_limit
        FROM accounts
        WHERE account_number = $1`,
        [accountID]
      )
    : await query(
        `SELECT account_number, name, amount, type, credit_limit
        FROM accounts
        WHERE account_number = $1`,
        [accountID]
      );

  if (res.rowCount === 0) {
    throw new AppError(ErrorCode.ACCOUNT_NOT_FOUND, "Account not found");
  }

  return res.rows[0];
};
