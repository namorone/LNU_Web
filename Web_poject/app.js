const express = require('express');
const app = express();
const port = process.env.PORT
const multer = require('multer'); // Для обробки файлів
const storage = multer.memoryStorage(); // Використовуємо memoryStorage для збереження файлів в оперативній пам'яті
const upload = multer({
  storage: storage,
  limits: { fieldSize: 25 * 1024 * 1024 } // Збільште ліміт розміру поля на 25 МБ
});
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
// const  Worker  = require('bull');
// const  Queue = require('bull');
//const upload = multer(); // Створення middleware для обробки файлів
const { User, Task } = require("./mongodb");
const multiplyQueue = [];
app.use(express.urlencoded({ extended: true }));//розпакування даних з POST-запиту.

app.get('/', (req, res) => {
  res.send(`вітає порт ${port}`); // Відповідь сервера
 });
app.post('/app-multiply-matrices',  upload.none(), async(req, res) => {
    //const startTimep = new Date();
    const matrix1s = req.body.matrix1;
    const matrix2s = req.body.matrix2;    
    const username = req.body.username;
    const taskId = req.body.taskId;
    console.log (port,taskId, matrix1s.length);
    
    //console.log(file1.buffer,file2.buffer)
    // Перевірка, чи файли успішно завантажені
    if (!matrix1s || !matrix2s) {
      return res.status(400).json({ error: 'Оберіть обидва файли' });
    }
    const matrix1 = await convertDataToMatrix(matrix1s);
    const matrix2 = await convertDataToMatrix(matrix2s);
    console.log(matrix1[0].length);
    const length = matrix1[0].length;
    await multiplyQueue.unshift({ matrix1, matrix2, taskId, username, length });
    console.log('в чергзі', multiplyQueue.length);
    await busyness();
    res.json({ message: 'Матриці прийняті та оброблені на сервері' });

  });

  
  
  app.listen(port, () => {
    console.log(`Сервер слухає на порті ${port}`);
  });
  
  function convertDataToMatrix(data) {
    if (data) {
      const m1 = data.split(',').map(Number);
      const numberOfRows = Math.sqrt(m1.length);
      const matrix = [];
      for (let i = 0; i < m1.length-1; i++) {
          matrix.push(m1.slice(i , i +  numberOfRows));
          i+=4;
      }
      return matrix;
    } else {
      console.error('Дані не були успішно зчитані');
    }
  }
  
  function sleep(ms) {
    const start = new Date().getTime();
    
   while (true) {
      const current = new Date().getTime();
     
     
     if (current-start >= ms) {
       break;
     }
   }
  }
           
  async function multiplyMatrices(matrix1, matrix2, taskId_, username) {
    console.log("початок множення",taskId_, username);
    const rows1 = matrix1.length;
    const cols1 = matrix1[0].length;
    const cols2 = matrix2[0].length;
    const totalTasks = rows1 * cols2; 
    let completedTasks = 0; 
    let lastPercentage = 0; // Останній виведений відсоток
  
    //console.log(cols1, matrix2.length, cols2 );
    if (cols1 !== cols2) {
      // Перевірка на можливість множення матриць
      return null; // Неможливо перемножити матриці
    }
  
    let task_ut = await Task.findOne({ taskId: taskId_, username: username})
           task_ut.topicality = 'Multy';
           task_ut.save();
    let resultMatrix = new Array(rows1);
    //const resultMatrix = await mult(rows1, cols2, cols1, totalTasks, taskId_, username);
   
      for (let i = 0; i < rows1; i++) {
        resultMatrix[i] = new Array(cols2);
        //console.log(i);
        sleep(1500*50/rows1);
        for (let j = 0; j < cols2; j++) {
          resultMatrix[i][j] = 0;
          //console.log(i, j);
          for (let k = 0; k < cols1; k++) {
            resultMatrix[i][j] += matrix1[i][k] * matrix2[k][j];
            //console.log(resultMatrix[i][j]);
          }
          completedTasks++; // Збільшуємо лічильник завершених завдань
          const percentage = Math.floor((completedTasks / totalTasks) * 100);
    
          // Виводимо відсоток лише коли він змінюється на наступне ціле значення
          if (percentage !== lastPercentage && percentage <= 99) {
            //console.log(`Виконано: ${percentage}%`);
            lastPercentage = percentage;
             let task = await Task.findOne({ taskId: taskId_, username: username})
             task.percentege_of_compile = lastPercentage;
                task.save();
          }
        }
        let task_p = await Task.findOne({ taskId: taskId_, username: username})
        //console.log(task_p.topicality);
        if (task_p.topicality === 'Cancel') {
          break;
        }
      }
      // console.log('Результат множення матриць:');
     //console.log(resultMatrix);
     //return resultMatrix;
     const csvresultMatrix = await resultMatrix.map(row => row.join(',')).join('\n');
     const resultBuffer = Buffer.from(csvresultMatrix, 'utf8');
      let task_upr = await Task.findOne({ taskId: taskId_, username: username })
      if (task_upr.topicality === 'Cancel') {
        task_upr.result = resultBuffer;
        task_upr.save();
      }else{
      task_upr.percentege_of_compile = 100;
      task_upr.topicality = 'Done';
      task_upr.result = resultBuffer;
      task_upr.save();
      }
  }
  async function worker  ()
  {
    try {
      if (multiplyQueue.length > 0){
        const { matrix1, matrix2, taskId, username } = multiplyQueue.pop();
        // Множення матриць асинхронно
        //console.log(matrix1[0], matrix2[0], taskId, username);
        console.log(`${taskId} множеться`);
        await multiplyMatrices(matrix1, matrix2, taskId, username);
        console.log(`Збереження результатів в базу даних ${taskId}`);
        await busyness();
      }
      
      setTimeout(worker, 1000);
    } catch (error) {
      console.error('Помилка обробки фонової задачі:', error);
      throw error;
    }
  };
  async function busyness( ){
    let totalLength = 0;
    for (const task of multiplyQueue) {
      totalLength += task.length;
    }
    console.log(` ${totalLength}в черзі ${port}`);
    
    fetch('https://localhost:3000/queue', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ port:port, length: totalLength })
        }).then(response => response.json())
        .catch(error => {console.error('Error:', error);});
  }
  worker();
//cd /d "E:\nginx-1.24.0"    start nginx
  //$env:PORT=5000; node app.js
  //$env:PORT=5001; node app.js