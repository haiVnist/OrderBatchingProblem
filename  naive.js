const calculateDistance = require("./utils").calculateDistance;
const getOrderItemsList = require("./utils").getOrderItemsList;

const naiveAlgorithm = (pickingCapacity, orders) => {
  let totalDistance = 0;
  let batch = [];
  let batches = [];
  let currentCapacity = 0;
  for (let order of orders) {
    if (currentCapacity + order.totalItems <= pickingCapacity) {
      batch.push(order);
      currentCapacity += order.totalItems;
    } else {
      batches.push(batch);
      batch = [];
      batch.push(order);
      currentCapacity = order.totalItems;
    }
  }

  batches.forEach((batch) => {
    const pickList = [];
    batch.forEach((order) => {
      pickList.push(...getOrderItemsList(order.orderId, orders));
    });
    totalDistance += calculateDistance(pickList);
  });
  return totalDistance;
};

module.exports = naiveAlgorithm;
