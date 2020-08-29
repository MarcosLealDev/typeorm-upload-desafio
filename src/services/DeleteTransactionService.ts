import { getCustomRepository } from 'typeorm';
import AppError from '../errors/AppError';

import TransactionRepository from '../repositories/TransactionsRepository';

class DeleteTransactionService {
  public async execute(id: string): Promise<void> {
    // Busca pra ver se existe
    const transactionRepository = getCustomRepository(TransactionRepository);

    const transactionExists = await transactionRepository.findOne(id);

    if (!transactionExists) {
      throw new AppError('Transaction does not exists.');
    }

    await transactionRepository.remove(transactionExists);
  }
}

export default DeleteTransactionService;
