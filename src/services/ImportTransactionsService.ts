// import { getRepository } from 'typeorm';
// import path from 'path';
import fs from 'fs';
import csvParse from 'csv-parse';
// import uploadConfig from '../config/upload';

// import AppError from '../errors/AppError';

import Transaction from '../models/Transaction';

class ImportTransactionsService {
  async execute(filePath: string): Promise<Transaction[]> {
    // ler o arquivo csv
    // ordenar os registros por income antes de outcome
    // verificar se o balance nao eh quebrado
    // para cada registro que passar, verificar se uma categoria deve ser criada ou atualizada
    // para cada registro que passar, criar uma transaction
    // devolver todas as transacoes cadastradas

    const contactsReadStream = fs.createReadStream(filePath);

    const parsers = csvParse({
      delimiter: ',',
      from_line: 2,
    });

    const parseCSV = contactsReadStream.pipe(parsers);

    const transactions = [];
    const categories = [];

    parseCSV.on('data', async line => {
      const [title, type, value, category] = line.map((cell: string) =>
        cell.trim(),
      );

      if (!title || !type || !value) return;

      categories.push(category);
      transactions.push({ title, type, value, category });
    });

    await new Promise(resolve => parseCSV.on('end', resolve));

    transactions.sort((a, b) => {
      if (a.type > b.type) {
        return 1;
      }
      if (a.type < b.type) {
        return -1;
      }
      return 0;
    });
  }
}

export default ImportTransactionsService;
