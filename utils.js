const {
  products,
  SHELVES_LENGTH,
  DISTANCE_BETWEEN_AISLES,
  DISTANCE_BETWEEN_DEPOT_FIRST_AISLE,
  ENTIRE_AISLE_LENGTH,
} = require("./constant");

/** S-shape routing policy */
/**
 * pickingList = [1, 2, 3] // array of product_id
 */
const calculateDistance = (pickingList) => {
  let totalDistance = 0;
  const aislesToTraverse = new Set([]);
  pickingList.forEach((el) => {
    aislesToTraverse.add(products[el].column);
  });

  const sortedSet = Array.from(aislesToTraverse).sort();
  for (i = 0; i < sortedSet.length; i++) {
    if (i === 0) {
      totalDistance +=
        sortedSet[i] * DISTANCE_BETWEEN_AISLES +
        DISTANCE_BETWEEN_DEPOT_FIRST_AISLE;
    } else {
      totalDistance +=
        (sortedSet[i] - sortedSet[i - 1]) * DISTANCE_BETWEEN_AISLES;
    }

    if (i === sortedSet.length - 1) {
      if (sortedSet.length % 2 === 1) {
        const furthestShelfOnLastAisle = pickingList.reduce(
          (furthestShelf, current) => {
            if (
              products[current].column === sortedSet[i] &&
              products[current].row > furthestShelf
            ) {
              return products[current].row;
            } else {
              return furthestShelf;
            }
          },
          0
        );
        totalDistance += furthestShelfOnLastAisle * SHELVES_LENGTH * 2;
        totalDistance +=
          sortedSet[i] * DISTANCE_BETWEEN_AISLES +
          DISTANCE_BETWEEN_DEPOT_FIRST_AISLE; // return to the depot
        return totalDistance;
      } else {
        totalDistance +=
          sortedSet[i] * DISTANCE_BETWEEN_AISLES +
          DISTANCE_BETWEEN_DEPOT_FIRST_AISLE; // return to the depot
      }
    }

    totalDistance += ENTIRE_AISLE_LENGTH;
  }

  return totalDistance;
};

const getOrderItemsList = (orderId, orders) => {
  const itemsList = [];
  for (let i = 0; i < orders.length; i++) {
    if (orders[i].orderId === orderId) {
      orders[i].products.forEach((product) => {
        itemsList.push(product.productId);
      });

      return itemsList;
    }
  }
};

module.exports = { calculateDistance, getOrderItemsList };
