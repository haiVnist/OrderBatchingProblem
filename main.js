const geneticAlgorithm = require("./ga");
const naiveAlgorithm = require("./ naive");
const generateOrders = require("./test_gen");

/* 
    Number of orders varies from 10 to 100 with an 
    increment of 10
    Total number of items for each order is randomly chosen between
    2 and 10.
    With each number of orders, we have 10 test instances
*/

const pickingCapacity = [48];

pickingCapacity.forEach((capacity) => {
  console.log(capacity);
  let numberOfOrders = 10;
  while (numberOfOrders <= 100) {
    const orders = generateOrders(numberOfOrders);
    const gaRes = geneticAlgorithm(capacity, orders);
    const naiveRes = naiveAlgorithm(capacity, orders);
    const improvement = 100 - (gaRes / naiveRes) * 100;
    console.log(`${numberOfOrders} - ${improvement}`);
    numberOfOrders += 10;
  }
});
