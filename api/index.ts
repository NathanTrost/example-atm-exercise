import express from "express";
import transactionsRouter from "./routes/transactions";
import accountsRouter from "./routes/accounts";

const app = express();
const PORT = process.env.PORT;

const uiPort = process.env.UI_PORT || "3001";

const authUiOrigins = [
  `http://localhost:${uiPort}`,
  `http://127.0.0.1:${uiPort}`,
];
const apiOrigin = `http://api:${process.env.API_PORT || 3000}`;

const cspOrigins =
  process.env.NODE_ENV === "production"
    ? [apiOrigin]
    : [apiOrigin, ...authUiOrigins];

app.use(express.json());

app.use(function (_, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  res.header("Access-Control-Allow-Methods", "*");
  res.header(
    "Content-Security-Policy",
    `default-src 'self'; connect-src 'self' ${cspOrigins.join()} ws: wss:`
  );
  next();
});

// Setup Routes
app.use("/transactions", transactionsRouter);
app.use("/accounts", accountsRouter);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
