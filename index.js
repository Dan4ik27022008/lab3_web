import {Command} from 'commander';
import {readFileSync} from 'node:fs';

const program = new Command();

// Налаштування програми та глобальна опція
program
  .name('library-cli')
  .description('CLI програма для роботи з даними бібліотеки')
  .version('1.0.0')
  .option('-f, --file <path>', 'шлях до JSON-файлу', 'data.json');

// Функція для безпечного читання файлу
function readJSON(path) {
  try {
    const fileContent = readFileSync(path, 'utf-8');
    return JSON.parse(fileContent);
  } catch (error) {
    program.error(`Помилка: Не вдалося прочитати файл '${path}' або файл містить некоректний JSON.`);
  }
}

// 1. Перелік
program
  .command('list')
  .description('Показати стислий список книг')
  .option('-l, --limit <number>', 'обмежити кількість записів')
  .action((options) => {
    const data = readJSON(program.opts().file);
    let result = data;
    
    if (options.limit) {
      const limit = parseInt(options.limit, 10);
      if (isNaN(limit) || limit <= 0) {
        program.error('Помилка: Ліміт має бути додатним числом.');
      }
      result = data.slice(0, limit);
    }
    
    result.forEach((item, index) => {
      console.log(`${index + 1}. "${item.book}" - ${item.author}`);
    });
  });

// 2. Один елемент
program
  .command('get <title> [copyNumber]')
  .description('Показати всі дані про конкретну книгу за назвою, або про конкретний її примірник за номером')
  .action((title, copyNumber) => {
    const data = readJSON(program.opts().file);
    const book = data.find(b => b.book.toLowerCase() === title.toLowerCase());
    
    if (!book) {
      program.error(`Помилка: Книгу з назвою "${title}" не знайдено.`);
    }

    // Якщо передано номер примірника
    if (copyNumber) {
      const copyNumParsed = parseInt(copyNumber, 10);
      
      if (isNaN(copyNumParsed)) {
        program.error(`Помилка: Номер примірника має бути числом.`);
      }

      const specificCopy = book.copies.find(c => c.number === copyNumParsed);
      
      if (!specificCopy) {
        program.error(`Помилка: Примірник з номером ${copyNumParsed} для книги "${title}" не знайдено.`);
      }

      // Вивід деталей конкретного примірника
      console.log(`\nДеталі примірника №${specificCopy.number}:`);
      console.log(`----------------------------------------`);
      console.log(`  Книга:  "${book.book}"`);
      console.log(`  Статус: ${specificCopy.available ? 'Доступний' : 'Недоступний'}`);
      console.log(`  Історія видач (${specificCopy.read_history.length} записів):`);
      
      if (specificCopy.read_history.length === 0) {
        console.log(`    Історія порожня.`);
      } else {
        specificCopy.read_history.forEach(h => {
          // Переведення часу з UNIX timestamp в дату
          const grantDate = new Date(h.date_of_granting * 1000).toLocaleDateString('uk-UA');
          const returnDate = h.return_date ? new Date(h.return_date * 1000).toLocaleDateString('uk-UA') : 'ще не повернуто';
          console.log(`\n    - Читач: ${h.name} \n    Видано:    ${grantDate}\n    Повернуто: ${returnDate}`);
        });
      }
      return;
    }

    // Якщо номер примірника не передано
    console.log(`\nІнформація про книгу:`);
    console.log(`----------------------------------------`);
    console.log(`  Назва:       "${book.book}"`);
    console.log(`  Автор:       ${book.author}`);
    console.log(`  Рік видання: ${book.publication_year}`);
    console.log(`  Примірників: ${book.copies.length}`);
    console.log(`  Доступні:    ${book.copies.filter(copy => copy.available === true).length}`);
    console.log(`\nДеталі по примірниках:`);
    console.log(`----------------------------------------`);
    
    book.copies.forEach((copy, index) => {
      const status = copy.available ? 'Доступний' : 'Недоступний';
      const historyCount = copy.read_history.length;
      console.log(`  ${index + 1}. №${copy.number} — ${status}`);
      console.log(`     Історія видач: записів ${historyCount}`);
    });
  });

  // 3. Окреме поле
  program
  .command('field <title> <path>')
  .description('Показати значення окремого поля книги (можна використовувати точкову нотацію, напр., copies.0.available)')
  .action((title, path) => {
    const data = readJSON(program.opts().file);
    const book = data.find(b => b.book.toLowerCase() === title.toLowerCase());
    
    if (!book) {
      program.error(`Помилка: Книгу з назвою "${title}" не знайдено.`);
    }

    // Розбиває шлях на масив ключів ("copies.0.available" -> ["copies", "0", "available"])
    const keys = path.split('.');
    let current = book;

    // Послідовно переходить по кожному ключу
    for (const key of keys) {
      // Якщо на якомусь етапі натрапить на null/undefined або ключа не існує — це помилка
      if (current === null || typeof current !== 'object' || !(key in current)) {
        program.error(`Помилка: Шлях "${path}" (не знайдено ключ "${key}") відсутній у книзі.`);
      }
      current = current[key];
    }

    if (current === null) {
      // Якщо результат є null
      console.log('null');
    } else if (typeof current === 'object') {
      // Якщо результат є об'єктом або масивом
      console.log(JSON.stringify(current, null, 2));
    } else {
      // Якщо це рядок, число або булеве значення
      console.log(current);
    }
  });

// Парсинг аргументів
program.parse();