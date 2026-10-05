import { Command } from 'commander';
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
    program.error(`Помилка: Не вдалося прочитати файл '${options.file}' або файл містить некоректний JSON.`);
  }
}

// Запуск парсингу аргументів та запис їх в змінну
program.parse();
const options = program.opts();

// Вивід прочитаного JSON
console.log(JSON.stringify(readJSON(options.file), null, 2));