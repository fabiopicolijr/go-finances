import { getRepository, In } from 'typeorm';
import fs from 'fs';
import csvParse from 'csv-parse';
import Transaction from '../models/Transaction';
import Category from '../models/Category';
// import TransactionsRepository from '../repositories/TransactionsRepository';

interface RequestCSV {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category: string;
}

/*
  transactions.sort((a, b) => {
    if (a.type > b.type) {
      return 1;
    }
    if (a.type < b.type) {
      return -1;
    }
    return 0;
  });
*/

class ImportTransactionsService {
  async execute(filePath: string): Promise<Transaction[]> {
    const transactionRepository = getRepository(Transaction);
    const categoryRepository = getRepository(Category);

    const contactsReadStream = fs.createReadStream(filePath);

    const parsers = csvParse({
      from_line: 2,
    });

    const parseCSV = contactsReadStream.pipe(parsers);

    const transactions: RequestCSV[] = [];
    const categoriesCSV: string[] = [];

    parseCSV.on('data', async line => {
      const [title, type, value, category] = line.map((cell: string) =>
        cell.trim(),
      );

      if (!title || !type || !value) return;

      categoriesCSV.push(category);
      transactions.push({ title, type, value, category });
    });

    await new Promise(resolve => parseCSV.on('end', resolve));

    // Inicio do 'foreach' de categorias
    const existentCategories = await categoryRepository.find({
      where: {
        title: In(categoriesCSV),
      },
    });

    // deixando apenas o titulo nas categorias do BD pra ficar mais leve
    const existentCategoriesTitle = existentCategories.map(
      (category: Category) => category.title,
    );

    // filtrando as categorias CSV unicas que nao existem nas categorias do BD
    const addUniqueCategoryTitles = categoriesCSV
      .filter(category => !existentCategoriesTitle.includes(category))
      .filter((value, index, self) => self.indexOf(value) === index); // filtro que deixa os registros como unicos

    const newCategories = categoryRepository.create(
      addUniqueCategoryTitles.map(title => ({
        title,
      })),
    );
    // Fim do 'foreach' de categorias

    await categoryRepository.save(newCategories);

    const finalCategories = [...newCategories, ...existentCategories];

    const createdTransactions = transactionRepository.create(
      transactions.map(transaction => ({
        title: transaction.title,
        type: transaction.type,
        value: transaction.value,
        category: finalCategories.find(
          category => category.title === transaction.category,
        ),
      })),
    );

    await transactionRepository.save(createdTransactions);

    await fs.promises.unlink(filePath);

    return createdTransactions;
  }
}

export default ImportTransactionsService;
