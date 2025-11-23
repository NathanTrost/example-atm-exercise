export type AccountType = "checking" | "savings" | "credit";
export type TransactionType = "deposit" | "withdraw";

export type Account = {
  id: string;
  account_number: string;
  name: string;
  amount: number;
  type: AccountType;
  credit_limit: number;
};

export type Transaction = {
  id: string;
  account_id: string;
  type: TransactionType;
  timestamp: Date;
};
