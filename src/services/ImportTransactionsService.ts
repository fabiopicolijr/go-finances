import { getCustomRepository, getRepository, In, Not } from 'typeorm';
import fs from 'fs';
import csvParse from 'csv-parse';
import Transaction from '../models/Transaction';
import Category from '../models/Category';

interface RequestCSV {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category: string;
}

class ImportTransactionsService {
  async execute(filePath: string): Promise<Transaction[]> {
    // ler o arquivo csv
    // ordenar os registros por income antes de outcome
    // verificar se o balance nao eh quebrado
    // para cada registro que passar, verificar se uma categoria deve ser criada ou atualizada
    // para cada registro que passar, criar uma transaction
    // devolver todas as transacoes cadastradas

    const categoryRepository = getRepository(Category);
    // const transactionRepository = getCustomRepository(Repository);

    const contactsReadStream = fs.createReadStream(filePath);

    const parsers = csvParse({
      delimiter: ',',
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

    // Inicio do foreach de categorias do instrutor
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
      .filter((value, index, self) => self.indexOf(value) === index);

    const newCategories = categoryRepository.create(
      addUniqueCategoryTitles.map(title => ({
        title,
      })),
    );
    // Fim do foreach de categorias

    // await categoryRepository.save(newCategories);

    console.log({ exists: existentCategoriesTitle });

    console.log({ new: addUniqueCategoryTitles });

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
  }
}

export default ImportTransactionsService;
