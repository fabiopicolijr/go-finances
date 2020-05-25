import { Router } from 'express';

import { getCustomRepository } from 'typeorm';

import TransactionsRepository from '../repositories/TransactionsRepository';
import CreateTransactionService from '../services/CreateTransactionService';
// import DeleteTransactionService from '../services/DeleteTransactionService';
// import ImportTransactionsService from '../services/ImportTransactionsService';

const transactionsRouter = Router();

transactionsRouter.get('/', async (request, response) => {
  const transactionsRepository = getCustomRepository(TransactionsRepository);

  const balance = await transactionsRepository.getBalance();

  const transactions = await transactionsRepository.find();

  return response.json({ transactions, balance });
});

transactionsRouter.post('/', async (request, response) => {
  const { title, value, type } = request.body;

  const createTransaction = new CreateTransactionService();

  const transaction = await createTransaction.execute({
    title,
    value,
    type,
  });

  return response.json(transaction);
});

/*
transactionsRouter.delete('/:id', async (request, response) => {
  const { id } = request.params;

  const transactionsRepository = getCustomRepository(TransactionsRepository);

  const transaction = await transactionsRepository.find({
    where: { id },
  });

  transactionsRepository.delete(transaction);

  return response.json({ ok: true });
});

transactionsRouter.post('/import', async (request, response) => {
  // TODO
});
*/

export default transactionsRouter;
