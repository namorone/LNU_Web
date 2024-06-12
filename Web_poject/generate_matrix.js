const fs = require('fs');

function generateMatrix(rows, cols) {
  const matrix = [];
  for (let i = 0; i < rows; i++) {
    const row = [];
    for (let j = 0; j < cols; j++) {
      // Генеруємо випадкові значення для матриці (діапазон від 1 до 100)
      const randomValue = Math.floor(Math.random() * 100) + 1;
      row.push(randomValue);
    }
    matrix.push(row);
  }
  return matrix;
}

function matrixToString(matrix) {
  // Перетворюємо матрицю на рядок
  const rows = matrix.map(row => row.join(',')).join('\n');
  return rows;
}

const rows = 1400;
const cols = 1400;

const matrix1 = generateMatrix(rows, cols);
const matrix2 = generateMatrix(rows, cols);

const matrixString1 = matrixToString(matrix1);
const matrixString2 = matrixToString(matrix2);

// console.log("Матриця 1:");
// console.log(matrixString1);

// console.log("\nМатриця 2:");
// console.log(matrixString2);

// Зберегти матриці в файли
fs.writeFileSync('E:\matrix_1400_1.txt', matrixString1);
fs.writeFileSync('E:\matrix_1400-2.txt', matrixString2);

console.log('Матриці збережено в файли matrix1.txt і matrix2.txt.');
