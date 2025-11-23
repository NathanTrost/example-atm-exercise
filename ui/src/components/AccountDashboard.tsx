import { useRef, useState } from "react";
import { account } from "../Types/Account";
import Paper from "@mui/material/Paper/Paper";
import { Button, Card, CardContent, Grid, TextField } from "@mui/material";
import { transactionButton, transactionInput } from "../constants/styles";

type AccountDashboardProps = {
  account: account;
  signOut: () => Promise<void>;
};

export const AccountDashboard = (props: AccountDashboardProps) => {
  const [depositAmount, setDepositAmount] = useState(0);
  const [withdrawAmount, setWithdrawAmount] = useState(0);
  const [account, setAccount] = useState(props.account);
  const [errors, setErrors] = useState<{
    deposit: string | undefined;
    withdrawal: string | undefined;
  }>({ deposit: undefined, withdrawal: undefined });
  const depositInputRef = useRef<HTMLInputElement>(null);
  const withdrawalInputRef = useRef<HTMLInputElement>(null);

  const { signOut } = props;

  const validateDeposit = (amount: number): string | undefined => {
    if (!amount || amount <= 0) {
      return "Must be greater than 0";
    }
    if (amount > 1000) {
      return "Cannot deposit more than $1,000 in a single transaction";
    }
    if (account.type === "credit" && account.amount + amount > 0) {
      return "Cannot deposit in excess of credit limit";
    }
    return;
  };

  const depositFunds = async (): Promise<void> => {
    const validationError = validateDeposit(depositAmount);
    if (validationError) {
      console.warn("Deposit Input: User-based validation Failed");
      setErrors((prev) => ({ ...prev, deposit: validationError }));
      return;
    }

    const requestOptions = {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: depositAmount }),
    };
    try {
      const response = await fetch(
        `http://localhost:3000/transactions/${account.accountNumber}/deposit`,
        requestOptions
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Deposit failed. Please try again at a later time."
        );
      }

      setAccount({
        accountNumber: data.account_number,
        name: data.name,
        amount: data.amount,
        type: data.type,
        creditLimit: data.credit_limit,
      });
      // Clear input and error if successful
      if (depositInputRef.current) {
        depositInputRef.current.value = "";
      }
      setErrors((prev) => ({ ...prev, deposit: undefined }));
    } catch (err) {
      console.error(err instanceof Error ? err.message : "Unknown error");
      setErrors((prev) => ({
        ...prev,
        deposit: "Deposit failed. Please try again at a later time.",
      }));
    }
  };

  const validateWithdrawal = (amount: number): string | undefined => {
    if (!amount || amount <= 0) {
      return "Must be greater than 0";
    }
    if (amount > 200) {
      return "Cannot withdraw more than $200 in a single transaction";
    }
    if (amount % 5 !== 0) {
      return "Must be in $5 increments.";
    }

    // Check account balance (credit limit for credit accounts)
    const maxWithdrawal =
      account.type === "credit"
        ? (account.creditLimit || 0) + account.amount
        : account.amount;

    if (amount > maxWithdrawal) {
      return account.type === "credit"
        ? "Insufficient credit limit"
        : "Insufficient funds";
    }

    return;
  };

  const withdrawFunds = async (): Promise<void> => {
    const validationError = validateWithdrawal(withdrawAmount);

    if (validationError) {
      console.warn("Withdraw Input: User-based validation Failed");
      setErrors((prev) => ({ ...prev, withdrawal: validationError }));
      return;
    }

    const requestOptions = {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: withdrawAmount }),
    };
    try {
      const response = await fetch(
        `http://localhost:3000/transactions/${account.accountNumber}/withdraw`,
        requestOptions
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Withdrawal failed. Please try again at a later time."
        );
      }

      setAccount({
        accountNumber: data.account_number,
        name: data.name,
        amount: data.amount,
        type: data.type,
        creditLimit: data.credit_limit,
      });

      // Clear input and error if successful
      if (withdrawalInputRef.current) {
        withdrawalInputRef.current.value = "";
      }
      setErrors((prev) => ({ ...prev, withdrawal: undefined }));
    } catch (err) {
      console.error(err instanceof Error ? err.message : "Unknown error");
      setErrors((prev) => ({
        ...prev,
        withdrawal: "Withdrawal failed. Please try again at a later time.",
      }));
    }
  };

  return (
    <Paper className="account-dashboard">
      <div className="dashboard-header">
        <h1>Hello, {account.name}!</h1>
        <Button variant="contained" onClick={signOut}>
          Sign Out
        </Button>
      </div>
      <h2>Balance: ${account.amount}</h2>
      <Grid container spacing={2} padding={2}>
        <Grid item xs={6}>
          <Card className="deposit-card">
            <CardContent>
              <h3>Deposit</h3>
              <TextField
                label="Deposit Amount"
                variant="outlined"
                type="number"
                sx={transactionInput}
                error={Boolean(errors?.deposit)}
                helperText={errors?.deposit ?? " "}
                inputRef={depositInputRef}
                onBlur={(event) => {
                  const currentInputValue = Number(event.currentTarget.value);
                  if (currentInputValue !== depositAmount) {
                    setDepositAmount(currentInputValue);
                    if (errors?.deposit) {
                      setErrors((prev) => ({ ...prev, deposit: undefined }));
                    }
                  }
                }}
              />

              <Button
                variant="contained"
                sx={transactionButton}
                onClick={depositFunds}
              >
                Submit
              </Button>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6}>
          <Card className="withdraw-card">
            <CardContent>
              <h3>Withdraw</h3>
              <TextField
                label="Withdraw Amount"
                variant="outlined"
                type="number"
                sx={transactionInput}
                error={Boolean(errors?.withdrawal)}
                helperText={errors?.withdrawal ?? " "}
                inputRef={withdrawalInputRef}
                onBlur={(event) => {
                  const currentInputValue = Number(event.currentTarget.value);
                  if (currentInputValue !== withdrawAmount) {
                    setWithdrawAmount(currentInputValue);
                    if (errors?.withdrawal) {
                      setErrors((prev) => ({ ...prev, withdrawal: undefined }));
                    }
                  }
                }}
              />

              <Button
                variant="contained"
                sx={transactionButton}
                onClick={withdrawFunds}
              >
                Submit
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Paper>
  );
};
