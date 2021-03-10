const express = require("express");
const { v4: uuid } = require("uuid");

const app = express();
app.use(express.json());

customers = [];

app.get("/", (request, response) => {
  return response.json({ message: "ok!" });
});

app.get("/accounts", (request, response) => {
  return response.json(customers);
});

app.get("/statement", (request, response) => {
  const { cpf } = request.headers;

  const customer = customers.find((customer) => customer.cpf === cpf);

  if (!customer) {
    return response.json({
      message: `couldn't find a customer whose cpf is ${cpf}`,
    });
  }

  return response.json({
    name: customer.name,
    transactions: customer.transactions,
  });
});

app.post("/accounts", (request, response) => {
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

app.listen(3333, () => {
  console.log("server running on port 3333!");
});
