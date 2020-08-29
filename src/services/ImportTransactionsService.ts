import csvParse from 'csv-parse';
import fs from 'fs';

import { getCustomRepository, getRepository } from 'typeorm';
import Transaction from '../models/Transaction';

import TransactionRepository from '../repositories/TransactionsRepository';

import Category from '../models/Category';

interface TransactionCSV {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category: string;
}

class ImportTransactionsService {
  async execute(filename: string): Promise<Transaction[]> {
    // Read file.csv
    const readCSVStream = fs.createReadStream(filename);

    const parseStream = csvParse({
      from_line: 2,
      ltrim: true,
      rtrim: true,
    });

    const parseCSV = readCSVStream.pipe(parseStream);

    const transactionsList: TransactionCSV[] = [];
    const transactions: Transaction[] = [];

    parseCSV.on('data', ([title, type, value, category]) => {
      transactionsList.push({ title, value, type, category });
    });

    await new Promise(resolve => {
      parseCSV.on('end', resolve);
    });

    /* Add to the database */
    const transactionsRepository = getCustomRepository(TransactionRepository);
    const categoryRepository = getRepository(Category);

    transactionsList.forEach(async ({ title, type, value, category }) => {
      let categoryOnTable = await categoryRepository.findOne({
        where: { title: category },
      });

      if (!categoryOnTable) {
        categoryOnTable = categoryRepository.create({
          title: category,
        });

        await categoryRepository.save(categoryOnTable);
      }

      const transaction = transactionsRepository.create({
        title,
        value,
        type,
        category: categoryOnTable,
      });

      await transactionsRepository.save(transaction);
      transactions.push(transaction);
    });

    /* Delete */
    await fs.promises.unlink(filename);

    return transactions;
  }
}

export default ImportTransactionsService;
