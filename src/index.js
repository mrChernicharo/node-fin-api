const express = require("express");
const { v4: uuid } = require("uuid");

const app = express();
app.use(express.json());

// body params : post (json)
// route params : search, edit, delete
// query params : filtro, paginação
// headers : tokens, auth

customers = [];

function verifyAccountCPFExists(request, response, next) {
  const { cpf } = request.headers;

  const customer = customers.find((customer) => customer.cpf === cpf);

  if (!customer) {
    return response.json({
      message: `couldn't find a customer whose cpf is ${cpf}`,
    });
  }

  request.customer = customer;

  return next();
}

function getBalance(transactions) {
  const balance = transactions.reduce((acc, operation) => {
    switch (operation.type) {
      case "credit":
        acc += operation.amount;
        break;
      case "debit":
        acc -= operation.amount;
        break;
      default:
        throw new Error("transaction type not identified");
    }

    return acc;
  }, 0);

  console.log(balance);
  return balance;
}

app.get("/", (request, response) => {
  return response.json({ message: "ok!" });
});

app.post("/account", (request, response) => {
  const { name, cpf } = request.body;

  if (customers.some((customer) => customer.cpf === cpf)) {
    return response.status(400).json({ error: "CPF already in use" });
  }

  const customer = {
    id: uuid(),
    name,
    cpf,
    transactions: [],
  };
  customers.push(customer);

  return response.status(200).json(customer);
});

app.get("/account", (request, response) => {
  return response.json(customers);
});

app.get("/statement", verifyAccountCPFExists, (request, response) => {
  const { customer } = request;
  console.log(customer);

  return response.json({
    name: customer.name,
    transactions: customer.transactions,
    balance: getBalance(customer.transactions),
  });
});

app.get("/statement/date", verifyAccountCPFExists, (request, response) => {
  const { customer } = request;
  const { date } = request.query;

  const dateFormat = new Date(date + " 00:00");

  const dayTransactions = customer.transactions.filter(
    (operation) =>
      operation.created_at.toDateString() ===
      new Date(dateFormat).toDateString()
  );

  return response.json(dayTransactions);
});

app.post("/deposit", verifyAccountCPFExists, (request, response) => {
  const { description, amount } = request.body;
  const { cpf } = request.customer;

  const customer = customers.find((customer) => customer.cpf === cpf);

  const operation = {
    description,
    amount,
    created_at: new Date(),
    type: "credit",
  };

  customer.transactions.push(operation);

  return response
    .status(201)
    .json({ message: "deposit succesful", ...operation });
});

app.post("/withdraw", verifyAccountCPFExists, (request, response) => {
  const { amount } = request.body;
  const { customer } = request;

  const balance = getBalance(customer.transactions);

  if (amount <= balance) {
    const operation = {
      description: "withdraw",
      amount,
      created_at: new Date(),
      type: "debit",
    };
    console.log(balance);

    customer.transactions.push(operation);

    return response
      .status(201)
      .json({ message: "withdraw successful", ...operation });
  } else {
    return response.status(403).json({ error: "insuficient funds" });
  }
});

app.put("/account", verifyAccountCPFExists, (request, response) => {
  const { name } = request.body;
  const { customer } = request;

  customer.name = name;

  return response
    .status(201)
    .json({ message: `name successfully updated to ${name}` });
});

app.listen(3333, () => {
  console.log("server running on port 3333!");
});
