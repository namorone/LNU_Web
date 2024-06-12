const express = require('express');
const path = require('path');
const app = express();
const port = 3000;
const bcrypt = require('bcrypt'); // Для хешування паролів
const axios = require('axios');
const multer = require('multer'); // Для обробки файлів
// const User = require("./mongodb"); 
// const Task = require("./mongodb"); 
const { User, Task } = require("./mongodb");
const jwt = require('jsonwebtoken');
const fs = require('fs');
const https = require('https');
const bodyParser = require('body-parser');
app.use(bodyParser.json());
const secretKey = 'webprogbase_secret_key';
const options = {
  key: fs.readFileSync('./ssl/key.pem'),
  cert: fs.readFileSync('./ssl/cert.pem'),
};

https.createServer(options, app).listen(port, () => {
  console.log(`Сервер слухає на порті ${port}`);
});

const upload = multer(); // Створення middleware для обробки файлів
const servers = [
  {  port: 5000, weight: 1, status: ''},
  {  port: 5001, weight: 1, status: ''}
];

app.use(express.urlencoded({ extended: true }));//розпакування даних з POST-запиту.
app.use(express.static('style')); // Відправляє статичні файли з папки 'public'

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/login.html'); // Відповідь сервера
 });
app.get('/registration', (req, res) => {
  res.sendFile(__dirname + '/registration.html');
});
app.get('/login', (req, res) => {
  res.sendFile(__dirname + '/login.html');
});
app.get('/main', (req, res) => {
  res.sendFile(__dirname + '/main.html');
});
app.get('/history', (req, res) => {
  res.sendFile(__dirname + '/history.html');
});


// app.post('/register', async (req, res) => {
//   const { username, password } = req.body;

//   try {
//     const existingUser = await User.findOne({ username });

//     if (existingUser) {
//       res.status(400).json({ message: 'Користувач із таким іменем вже існує' });
//     } else {
//       const saltRounds = 10;
//       const hashedPassword = await bcrypt.hash(password, saltRounds);
//       const newUser = new User({
//         username,
//         password: hashedPassword
//       });
      
//       await newUser.save();
//       res.json({ message: 'Реєстрація успішна' });
//     }
//   } catch (error) {
//     console.error('Помилка реєстрації:', error);
//     res.status(500).json({ message: 'Помилка реєстрації' });
//   }
// });
app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  try {
    
    const existingUser = await User.findOne({ username });

    if (existingUser) {
      
      return res.status(409).json({ error:'Користувач із таким іменем вже існує'});
    }

    // Хешування паролю 
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Створення нового користувача з хешованим паролем
    const newUser = new User({
      username,
      password: hashedPassword
    });

    await newUser.save();
    res.json({ error:'Реєстрація успішна'});
     
  } catch (error) {
    console.error('Помилка реєстрації:', error);
    res.status(500).json({ error:'Помилка реєстрації'});
  }
});

app.post('/login', async (req, res) => {
  const username = req.body.username;
  const password = req.body.password;
  console.log(username, password)
  try {
    const existingUser = await User.findOne({ username });

    if (!existingUser) {
      return res.status(404).json({ error:'Користувача із введеним ім\'ям не знайдено'});
    }

    // Перевірка введеного паролю зі збереженим в базі даних
    const passwordMatch = await bcrypt.compare(password, existingUser.password);

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Неправильний пароль'});
    }
    const user = {
      username: username
    };
    
    const token = jwt.sign({ user }, secretKey, { expiresIn: '1h' });

    
    res.json({ success: true, token: token, redirectUrl: '/main' });
    //});
  } catch (error) {
    console.error('Помилка автентифікації:', error);
    res.status(500).json({ error:'Помилка автентифікації'});
  }
});
app.post('/tok',upload.none(), async (req, res) => {
  const token = req.body.token;
  
  try {
    const decodedToken = jwt.verify(token, secretKey);
    const { user } = decodedToken; // Отримання інформації про користувача з токену
    
    res.json({ success: true, username: user.username });
  } catch (error) {
    
    res.status(500).json({error:'Invalid token! Relogin', redirectUrl: '/login'});
  }
});
app.post('/cancel-task',upload.none(), async (req, res) => {
  const username = req.body.username;
  const taskId = req.body.taskId;
  const token = req.body.token;
  
  try {
    jwt.verify(token, secretKey);
    
  } catch (error) {
    
    return res.status(500).json({error:'Invalid token! Relogin', redirectUrl: '/login'});
  }
  
  //console.log(taskId, username);
  let task_ut = await Task.findOne({ taskId: taskId, username: username})
  task_ut.topicality = 'Cancel';
  task_ut.save();
  console.log('Завдання скасовано');
  res.json({ message:'Завдання скасовано'});
});

app.post('/get-task-result',upload.none(), async (req, res) => {
  const username = req.body.username;
  const taskId = req.body.taskId;
  //console.log(taskId, username);
  const token = req.body.token;
  
  try {
     jwt.verify(token, secretKey);
    
  } catch (error) {
    
    return res.status(500).json({error:'Invalid token! Relogin', redirectUrl: '/login'});
  }
  
  let task_ur = await Task.findOne({ taskId: taskId, username: username})
  //task_ur.result ;
  const resultString = task_ur.result.toString('utf8');
  //console.log(resultString);
  
  res.json({ result: resultString });
});

app.post('/task-progress',upload.none(), async (req, res) => {
  const taskId = req.body.taskId;
  const username = req.body.username;
  const token = req.body.token;
  
  try {
    jwt.verify(token, secretKey);
    
  } catch (error) {
    
    return res.status(500).json({error:'Invalid token! Relogin', redirectUrl: '/login'});
  }
  
  let task_p = await Task.findOne({ taskId: taskId, username: username})
  //console.log("процент чек");
  const progress = task_p.percentege_of_compile;
  //console.log(progress);
  res.json({ progress: progress });
});

// Опрацьовуємо POST-запит для множення матриць
app.post('/multiply-matrices', upload.fields([{ name: 'file1' }, { name: 'file2' }]), async(req, res) => {
  const startTimep = new Date();
  const file1 = req.files.file1[0];
  const file2 = req.files.file2[0];
  const username = req.body.username;
  const date =  req.body.date;
  const taskId = req.body.taskId;
  const token = req.body.token;
  
  try {
    jwt.verify(token, secretKey);
    
  } catch (error) {
    
    return res.status(500).json({error:'Invalid token! Relogin', redirectUrl: '/login'});
  }
  //console.log(file1,`-додавання-${taskId}`, file2);
  
  // Перевірка, чи файли успішно завантажені
  if (!file1 || !file2) {
    return res.status(400).json({ error: 'Помилка завантаження файлів' });
  }

  
  const task = new Task({
    username: username,
    date: date,
    taskId: taskId, 
    percentege_of_compile: 0, 
    topicality: 'Actual',
  });
  
  await task.save();
  const choice_serv = await balancer(servers);
  console.log('вибір', choice_serv, taskId);
  if(choice_serv === 'all server unactive'){
    return res.json({message: 'Проводяться технічні роботи, спробуйте пізніше'});
  }else{
    try {
      const startTimep2 = new Date();
      const matrix1 = convertDataToMatrix(file1.buffer.toString());
      const matrix2 = convertDataToMatrix(file2.buffer.toString());
      console.log('множ ',taskId)
      const formData = new FormData();
      //await formData.append('file1', file1 );
      //await formData.append('file2', file2);
      await formData.append('matrix1', matrix1 );
      await formData.append('matrix2', matrix2);
      await formData.append('username', req.body.username);
      await formData.append('taskId', req.body.taskId);
      
      const response = await fetch(`http://localhost:${choice_serv}/app-multiply-matrices`, {
        method: 'POST',
        body: formData
      })//then(response => console.log('рез',response.json()))
      .then( date =>{
        const endTime2 = new Date();
        const executionTime3 = endTime2- startTimep2; // Час виконання в мілісекундах
        console.log(`Час пересилки: ${executionTime3} мс`);
      })
      
    
    } catch (error) {
      console.error('Error:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
  }
  const endTimep = new Date();
  const executionTime2 = endTimep- startTimep; // Час виконання в мілісекундах
  
  console.log(`Час виконання поста: ${executionTime2} мс`);
  res.json({message: 'Завдання створено та обчислюється'});
});

// app.post('/app-multiply-matrices', upload.fields([{ name: 'file1' }, { name: 'file2' }]), async (req, res) => {
//   try {
//     const startTimep2 = new Date();
//     const file1 = req.files.file1[0];
//     const file2 = req.files.file2[0];
//     //console.log(file1,"-множ-", file2);
//     const matrix1 = convertDataToMatrix(file1.buffer.toString());
//     const matrix2 = convertDataToMatrix(file2.buffer.toString());
//     // Create a FormData object
//     console.log('множ ')
//     const formData = new FormData();
//     //await formData.append('file1', file1 );
//     //await formData.append('file2', file2);
//     await formData.append('matrix1', matrix1 );
//     await formData.append('matrix2', matrix2);
//     await formData.append('username', req.body.username);
//     await formData.append('taskId', req.body.taskId);

//     const response = await fetch('http://localhost:80/app-multiply-matrices', {
//       method: 'POST',
//       body: formData
//     })//then(response => console.log('рез',response.json()))
//     .then( date =>{
//       const endTime2 = new Date();
//       const executionTime3 = endTime2- startTimep2; // Час виконання в мілісекундах
//       console.log(`Час виконання обробки на сервер2: ${executionTime3} мс`);
//     })
//     //.catch (error=> {
//     //  console.error('Error:', error);
//     //});
//     // console.log(response);
//     // if (response.ok) {
//     //   const data = await response.json();
//     //   console.log('Success:', data);
//     //   res.json({ success: true, data });
//     // } else {
//     //   const errorText = await response.text();
//     //   console.error('Error:', errorText);
//     //   res.status(500).json({ success: false, error: errorText });
//     // }
  
//   } catch (error) {
//     console.error('Error:', error);
//     res.status(500).json({ success: false, error: error.message });
//   }
// });

app.post('/tasks', async (req, res) => {
  const username = req.body.username;
  const token = req.body.token;
  //console.log(username);
  try {
    jwt.verify(token, secretKey);
    
  } catch (error) {
    
    return res.status(500).json({error:'Invalid token! Relogin', redirectUrl: '/login'});
  }
  try {
      const userTasks = await Task.find({ username }).select('date taskId percentege_of_compile topicality').sort({ date: -1});
      userTasks.forEach(task => {
        // Перетворюємо значення taskId на число
        task.taskId = parseInt(task.taskId);
      });
      //console.log(userTasks);
      res.json(userTasks);
  } catch (error) {
      console.error('Помилка отримання завдань:', error);
      res.status(500).send('Помилка отримання завдань');
  }
});

app.post('/delete_task', async (req, res) => {
  const username = req.body.username;
  const taskId = req.body.taskId;
  const token = req.body.token;
  console.log('del', taskId, username);
  try {
    jwt.verify(token, secretKey);
    
  } catch (error) {
    
    return res.status(500).json({error:'Invalid token! Relogin       g', redirectUrl: '/login'});
  }
  try {
    await Task.deleteOne({ taskId: taskId, username: username })
    res.json({ message: 'Завдання видалено' });
  }catch(error)  {
    console.error('Помилка видалення завдань:', error);
    res.status(500).send('Помилка видалення завдань');
  }
});

app.post('/queue', async (req, res) => {
  const _port = req.body.port;
  const length = req.body.length;
  console.log('порт', _port, length);
  if (_port === '5000')
  {
    servers[0].weight = length;
    servers[0].status = 'active';
    
  }else if(_port === '5001')
  {
    servers[1].weight = length;
    servers[1].status = 'active';
  }
  
  res.json({ message: 'ок' });
});

async function isServerActive(server) {
  try {
    const response = await axios.get(`http://localhost:${server.port}`);//використовую бібліотеку axios для відправлення запиту до сервера і перевірки його статусу.
    //console.log(`Сервер ${response} `);
    if (response.status === 200) {
    return 'active';
    }
  } catch (error) {
    //console.error(`Сервер недоступний`);
    return false; // Помилка вказує на недоступність сервера
  }
}

async function checkServerStatus(servers_) {
  for (const server of servers_) {
    server.status = await isServerActive(server);
  }
  //console.log( servers);
}
 
async function weightedRoundRobin(servers) {
  
  // Відфільтрувати сервери за статусом "active"
  const activeServers = servers.filter(server => server.status === 'active');

  // Відсортувати відфільтровані сервери за вагою
  const h=activeServers.sort((a, b) => a.weight - b.weight);
  //console.log('сорт', h);
  // Взяти перший сервер з відсортованого списку (з найменшою вагою)
  const serverWithMinWeight = activeServers[0];
  if(serverWithMinWeight === undefined){
    
    return 'all server unactive'
  }else{
  //console.log('вибір', serverWithMinWeight);
  //console.log(serverWithMinWeight.port);
  return serverWithMinWeight.port;
  }
}

async function balancer(servers) {
  await checkServerStatus(servers);
  const p = await weightedRoundRobin(servers);
  //console.log('порт', p);
  return p;
}


function convertDataToMatrix(data) {
  if (data) {
    const rows = data.split('\n');
    const matrix = rows.map(row => row.split(',').map(Number));
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
  const rows1 = matrix1.length;
  const cols1 = matrix1[0].length;
  const cols2 = matrix2[0].length;
  const totalTasks = rows1 * cols2; 
  let completedTasks = 0; 
  let lastPercentage = 0; // Останній виведений відсоток

  
  if (cols1 !== matrix2.length) {
    // Перевірка на можливість множення матриць
    return null; // Неможливо перемножити матриці
  }

  let task_ut = await Task.findOne({ taskId: taskId_, username: username})
         task_ut.topicality = 'Multy';
         task_ut.save();
  const resultMatrix = new Array(rows1);

  for (let i = 0; i < rows1; i++) {
    resultMatrix[i] = new Array(cols2);
    //console.log(i);
    //sleep(1500*50/rows1);
    for (let j = 0; j < cols2; j++) {
      resultMatrix[i][j] = 0;
      //console.log(i, j);
      for (let k = 0; k < cols1; k++) {
        resultMatrix[i][j] += matrix1[i][k] * matrix2[k][j];
      }
      completedTasks++; // Збільшуємо лічильник завершених завдань
      const percentage = Math.floor((completedTasks / totalTasks) * 100);

      // Виводимо відсоток лише коли він змінюється на наступне ціле значення
      if (percentage !== lastPercentage && percentage <= 99) {
        console.log(`Виконано: ${percentage}%`);
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
   console.log('Результат множення матриць:');
   //console.log(resultMatrix);
   return resultMatrix;
}

async function getResultForUser(username, taskId)
{
  let task_r = await Task.findOne({ taskId: taskId, username: username})
  //const task = user.tasks.find((t) => t.taskId === taskId);
  const resultString = task_r.result.toString('utf8');

  console.log('Результат:');
  console.log(resultString);
}

//getResultForUser('Roman', '224746');

// console.log(username);
  // console.log('Матриця 1:');
  // console.log(matrix1);
  // console.log('Матриця 2:');
  // console.log(matrix2);
  
  // const matrix1 = convertDataToMatrix(file1.buffer.toString());
  // const matrix2 = convertDataToMatrix(file2.buffer.toString());
  // const startTime = new Date();
  // const resultMatrix = await multiplyMatrices(matrix1, matrix2, taskId, username);
  // const csvresultMatrix = resultMatrix.map(row => row.join(',')).join('\n');

  
  // console.log('крнвертація до csv');
  // const resultBuffer = Buffer.from(csvresultMatrix, 'utf8');
  // let task_upr = await Task.findOne({ taskId: taskId, username: username })
  // if (task_upr.topicality === 'Cancel') {
  //   task_upr.result = resultBuffer;
  //   task_upr.save();
  // }else{
  // task_upr.percentege_of_compile = 100;
  // task_upr.topicality = 'Done';
  // task_upr.result = resultBuffer;
  // task_upr.save();
  // }
  // const endTime = new Date();
  // const executionTime = endTime - startTime; 

  // console.log(`Час множення: ${executionTime} мс`);
  // res.json({ message: 'Матриці прийняті та оброблені на сервері' });
  // console.log('Збереження результатів в базу даних');
  // //const user = await User.findOne({ username: username });