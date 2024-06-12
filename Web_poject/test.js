const startPointId = new Date('2023-11-05T20:22:00.000Z')
const date = new Date().getTime();
const raze = date-startPointId;
const taskId = Math.floor((date-startPointId)/ 1000);
const date2 = new Date().getTime();
console.log(date,date2,date2-date); 

function sleep(ms) {
     const start = new Date().getTime();
     
    while (true) {
       const current = new Date().getTime();
      
      
      if (current-start >= ms) {
        break;
      }
    }
  }
const startTime = new Date();
sleep(100);
const endTime = new Date();
const executionTime = endTime - startTime; 

console.log(`Час виконання завдання: ${executionTime} мс`);