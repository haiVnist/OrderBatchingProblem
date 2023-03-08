const calculateDistance = require("./utils").calculateDistance;
const getOrderItemsList = require("./utils").getOrderItemsList;

let orderss = [];

const getOrderTotalItems = (orderId) => {
  for (let i = 0; i < orderss.length; i++) {
    if (orderss[i].orderId === orderId) {
      return orderss[i].totalItems;
    }
  }
};

const selectRandom = (numberOfBatches, chromosomeLength) => {
  const result = [];
  while (result.length < numberOfBatches) {
    let randomNum = Math.floor(Math.random() * chromosomeLength);
    if (!result.includes(randomNum)) {
      result.push(randomNum);
    }
  }

  return result;
};

const generateRandomSequence = (items) => {
  const sequence = [];
  const selectedIndices = new Set();

  while (sequence.length < items.length) {
    const randomIndex = Math.floor(Math.random() * items.length);
    if (!selectedIndices.has(randomIndex)) {
      selectedIndices.add(randomIndex);
      const randomItem = items[randomIndex];
      sequence.push(randomItem);
    }
  }

  return sequence;
};

const findBatches = (chromosome, numberOfBatches) => {
  const batches = [];
  for (let i = 0; i < numberOfBatches; i++) {
    batches.push({ total: 0, orders: [] });
  }

  chromosome.forEach((gene, index) => {
    batches[gene].orders.push(index);
    batches[gene].total += getOrderTotalItems(index);
  });

  return batches;
};

const seed = (numberOfBatches, chromosomeLength, pickingCapacity) => {
  const chromosome = new Array(chromosomeLength);
  const remainingOrders = [];
  for (let i = 0; i < chromosomeLength; i++) {
    remainingOrders.push(i);
  }
  let batches = [];
  for (let i = 0; i < numberOfBatches; i++) {
    batches.push({ total: 0, orders: [] });
  }

  // const randomOrders = selectRandom(numberOfBatches, chromosomeLength);
  // randomOrders.forEach((order, index) => {
  //   batches[index].orders.push(order);
  //   batches[index].total += getOrderTotalItems(order);
  // });

  // console.log(randomOrders);
  // console.log(batches);
  // const remainingOrders = [];
  // for (let i = 0; i < chromosomeLength; i++) {
  //   if (!randomOrders.includes(i)) {
  //     remainingOrders.push(i);
  //   }
  // }
  // console.log(remainingOrders);

  let count = 0;
  let batchesCopy;
  while (count !== remainingOrders.length) {
    count = 0;
    batchesCopy = JSON.parse(JSON.stringify(batches));
    const randomSequence = generateRandomSequence(remainingOrders);
    for (let i = 0; i < randomSequence.length; i++) {
      for (let j = 0; j < batchesCopy.length; j++) {
        const totalItems = getOrderTotalItems(randomSequence[i]);
        if (batchesCopy[j].total + totalItems > pickingCapacity) {
          continue;
        } else {
          batchesCopy[j].orders.push(randomSequence[i]);
          batchesCopy[j].total += totalItems;
          count++;
          break;
        }
      }
    }
  }

  batches = JSON.parse(JSON.stringify(batchesCopy));
  batches.forEach((batch, batchIndex) => {
    batch.orders.forEach((order) => {
      chromosome[+order] = batchIndex;
    });
  });

  return { chromosome, batches };
};

class Individual {
  constructor(chromosome, batches, pickingCapacity) {
    this.pickingCapacity = pickingCapacity;
    this.chromosome = chromosome;
    this.batches = batches;
    this.fitnessValue = this.calculateFitness(this.batches);
    this.unfitnessValue = this.calculateUnFitness(this.batches);
    this.improve();
  }

  /**
   * batches = [
   *  {
   *    total: 100,
   *    orders: [1, 2 , 3]
   *  }
   * ]
   */
  movePhase1() {
    //const batchesCopy = JSON.parse(JSON.stringify(this.batches));
    const batchesCopy = this.batches;
    const bestMove = {
      sourceBatch: null,
      orderToMoveIndex: null,
      orderToMove: null,
      destinationBatch: null,
    };
    let isImproved = false;
    let bestValue = this.unfitnessValue;
    batchesCopy.forEach((sourceBatch, sourceBatchIndex) => {
      if (sourceBatch.total > this.pickingCapacity) {
        sourceBatch.orders.forEach((order, orderIndexInBatch) => {
          batchesCopy.forEach((destinationBatch, destinationBatchIndex) => {
            if (
              sourceBatchIndex !== destinationBatchIndex &&
              destinationBatch.total < this.pickingCapacity
            ) {
              // move
              sourceBatch.orders.splice(orderIndexInBatch, 1);
              sourceBatch.total -= getOrderTotalItems(order);
              destinationBatch.orders.push(order);
              destinationBatch.total += getOrderTotalItems(order);
              // compare with current bestValue
              const value = this.calculateUnFitness(batchesCopy);
              if (value < bestValue) {
                bestValue = value;
                bestMove.sourceBatch = sourceBatch;
                bestMove.orderToMove = order;
                bestMove.orderToMoveIndex = orderIndexInBatch;
                bestMove.destinationBatch = destinationBatch;
                isImproved = true;
              }
              // restore
              sourceBatch.orders.splice(orderIndexInBatch, 0, order);
              sourceBatch.total += getOrderTotalItems(order);
              destinationBatch.orders.pop();
              destinationBatch.total -= getOrderTotalItems(order);
            }
          });
        });
      }
    });

    if (isImproved) {
      const { sourceBatch, orderToMoveIndex, orderToMove, destinationBatch } =
        bestMove;
      sourceBatch.orders.splice(orderToMoveIndex, 1);
      sourceBatch.total -= getOrderTotalItems(orderToMove);
      destinationBatch.orders.push(orderToMove);
      destinationBatch.total += getOrderTotalItems(orderToMove);
      this.unfitnessValue = bestValue;
    }

    return isImproved;
  }

  swap11Phase1() {
    const batchesCopy = this.batches;
    const bestMove = {
      batch1: null,
      order1: null,
      order1Index: null,
      batch2: null,
      order2: null,
      order2Index: null,
    };
    let isImproved = false;
    let bestValue = this.unfitnessValue;
    batchesCopy.forEach((batch1, batch1Index) => {
      if (batch1.total > this.pickingCapacity) {
        batch1.orders.forEach((order1, order1Index) => {
          batchesCopy.forEach((batch2, batch2Index) => {
            if (
              batch1Index !== batch2Index &&
              batch2.total < this.pickingCapacity
            ) {
              batch2.orders.forEach((order2, order2Index) => {
                // swap 1 - 1
                batch1.orders.splice(order1Index, 1);
                batch2.orders.splice(order2Index, 1);
                batch1.orders.splice(order1Index, 0, order2);
                batch1.total =
                  batch1.total +
                  getOrderTotalItems(order2) -
                  getOrderTotalItems(order1);
                batch2.orders.splice(order2Index, 0, order1);
                batch2.total =
                  batch2.total +
                  getOrderTotalItems(order1) -
                  getOrderTotalItems(order2);
                // compare with current bestValue
                const value = this.calculateUnFitness(batchesCopy);
                if (value < bestValue) {
                  bestValue = value;
                  isImproved = true;
                  bestMove.batch1 = batch1;
                  bestMove.order1Index = order1Index;
                  bestMove.order1 = order1;
                  bestMove.batch2 = batch2;
                  bestMove.order2Index = order2Index;
                  bestMove.order2 = order2;
                }
                // restore
                batch1.orders.splice(order1Index, 1);
                batch2.orders.splice(order2Index, 1);
                batch1.orders.splice(order1Index, 0, order1);
                batch1.total =
                  batch1.total -
                  getOrderTotalItems(order2) +
                  getOrderTotalItems(order1);
                batch2.orders.splice(order2Index, 0, order2);
                batch2.total =
                  batch2.total -
                  getOrderTotalItems(order1) +
                  getOrderTotalItems(order2);
              });
            }
          });
        });
      }
    });

    if (isImproved) {
      const { order1, order1Index, batch1, batch2, order2, order2Index } =
        bestMove;
      this.unfitnessValue = bestValue;
      batch1.orders.splice(order1Index, 1);
      batch2.orders.splice(order2Index, 1);
      batch1.orders.splice(order1Index, 0, order2);
      batch1.total =
        batch1.total + getOrderTotalItems(order2) - getOrderTotalItems(order1);
      batch2.orders.splice(order2Index, 0, order1);
      batch2.total =
        batch2.total + getOrderTotalItems(order1) - getOrderTotalItems(order2);
    }

    return isImproved;
  }

  swap12Phase1() {
    const batchesCopy = this.batches;
    const bestMove = {
      batch1: null,
      order1: null,
      order1Index: null,
      batch2: null,
      order21: null,
      order21Index: null,
      order22: null,
      order22Index: null,
    };
    let isImproved = false;
    let bestValue = this.unfitnessValue;
    batchesCopy.forEach((batch1, batch1Index) => {
      if (batch1.total > this.pickingCapacity) {
        batch1.orders.forEach((order1, order1Index) => {
          batchesCopy.forEach((batch2, batch2Index) => {
            if (
              batch1Index !== batch2Index &&
              batch2.total < this.pickingCapacity
            ) {
              for (let i = 0; i < batch2.orders.length - 1; i++) {
                for (let j = i + 1; j < batch2.orders.length; j++) {
                  // backup
                  const orders1Backup = JSON.parse(
                    JSON.stringify(batch1.orders)
                  );
                  const orders2Backup = JSON.parse(
                    JSON.stringify(batch2.orders)
                  );
                  // swap 1 - 2
                  const order21 = batch2.orders[i];
                  const order22 = batch2.orders[j];
                  batch1.orders.splice(order1Index, 1);
                  batch2.orders.splice(i, 1);
                  batch2.orders.splice(j - 1, 0);
                  batch1.orders.push(order21, order22);
                  batch1.total =
                    batch1.total +
                    getOrderTotalItems(order21) +
                    getOrderTotalItems(order22) -
                    getOrderTotalItems(order1);
                  batch2.orders.push(order1);
                  batch2.total =
                    batch2.total +
                    getOrderTotalItems(order1) -
                    getOrderTotalItems(order21) -
                    getOrderTotalItems(order22);
                  // compare with current bestValue
                  const value = this.calculateUnFitness(batchesCopy);
                  if (value < bestValue) {
                    bestValue = value;
                    isImproved = true;
                    bestMove.batch1 = batch1;
                    bestMove.order1 = order1;
                    bestMove.order1Index = order1Index;
                    bestMove.batch2 = batch2;
                    bestMove.order21 = order21;
                    bestMove.order21Index = i;
                    bestMove.order22 = order22;
                    bestMove.order22Index = j;
                  }
                  // restore
                  batch1.orders = orders1Backup;
                  batch2.orders = orders2Backup;
                  batch1.total =
                    batch1.total -
                    getOrderTotalItems(order21) -
                    getOrderTotalItems(order22) +
                    getOrderTotalItems(order1);
                  batch2.total =
                    batch2.total -
                    getOrderTotalItems(order1) +
                    getOrderTotalItems(order21) +
                    getOrderTotalItems(order22);
                }
              }
            }
          });
        });
      }
    });

    if (isImproved) {
      const {
        order1,
        order1Index,
        batch1,
        batch2,
        order21,
        order21Index,
        order22,
        order22Index,
      } = bestMove;
      this.unfitnessValue = bestValue;
      batch1.orders.splice(order1Index, 1);
      batch2.orders.splice(order21Index, 1);
      batch2.orders.splice(order22Index - 1, 0);
      batch1.orders.push(order21, order22);
      batch1.total =
        batch1.total +
        getOrderTotalItems(order21) +
        getOrderTotalItems(order22) -
        getOrderTotalItems(order1);
      batch2.orders.push(order1);
      batch2.total =
        batch2.total +
        getOrderTotalItems(order1) -
        getOrderTotalItems(order21) -
        getOrderTotalItems(order22);
    }

    return isImproved;
  }

  swap21Phase1() {
    const batchesCopy = this.batches;
    const bestMove = {
      batch2: null,
      order2: null,
      order2Index: null,
      batch1: null,
      order11: null,
      order11Index: null,
      order12: null,
      order12Index: null,
    };
    let isImproved = false;
    let bestValue = this.unfitnessValue;
    batchesCopy.forEach((batch1, batch1Index) => {
      if (batch1.total > this.pickingCapacity) {
        for (let i = 0; i < batch1.orders.length - 1; i++) {
          for (let j = i + 1; j < batch1.orders.length; j++) {
            batchesCopy.forEach((batch2, batch2Index) => {
              if (
                batch1Index !== batch2Index &&
                batch2.total < this.pickingCapacity
              ) {
                batch2.orders.forEach((order2, order2Index) => {
                  // backup
                  const orders1Backup = JSON.parse(
                    JSON.stringify(batch1.orders)
                  );
                  const orders2Backup = JSON.parse(
                    JSON.stringify(batch2.orders)
                  );
                  // swap 2 - 1
                  const order11 = batch1.orders[i];
                  const order12 = batch1.orders[j];
                  batch2.orders.splice(order2Index, 1);
                  batch1.orders.splice(i, 1);
                  batch1.orders.splice(j - 1, 0);
                  batch2.orders.push(order11, order12);
                  batch2.total =
                    batch2.total +
                    getOrderTotalItems(order11) +
                    getOrderTotalItems(order12) -
                    getOrderTotalItems(order2);
                  batch1.orders.push(order2);
                  batch1.total =
                    batch1.total +
                    getOrderTotalItems(order2) -
                    getOrderTotalItems(order11) -
                    getOrderTotalItems(order12);
                  // compare with current bestValue
                  const value = this.calculateUnFitness(batchesCopy);
                  if (value < bestValue) {
                    bestValue = value;
                    isImproved = true;
                    bestMove.batch1 = batch1;
                    bestMove.order2 = order2;
                    bestMove.order2Index = order2Index;
                    bestMove.batch2 = batch2;
                    bestMove.order11 = order11;
                    bestMove.order11Index = i;
                    bestMove.order12 = order12;
                    bestMove.order12Index = j;
                  }
                  // restore
                  batch1.orders = orders1Backup;
                  batch2.orders = orders2Backup;
                  batch2.total =
                    batch2.total -
                    getOrderTotalItems(order11) -
                    getOrderTotalItems(order12) +
                    getOrderTotalItems(order2);
                  batch1.total =
                    batch1.total -
                    getOrderTotalItems(order2) +
                    getOrderTotalItems(order11) +
                    getOrderTotalItems(order12);
                });
              }
            });
          }
        }
      }
    });

    if (isImproved) {
      const {
        batch1,
        batch2,
        order11,
        order11Index,
        order12,
        order12Index,
        order2,
        order2Index,
      } = bestMove;
      this.unfitnessValue = bestValue;
      batch2.orders.splice(order2Index, 1);
      batch1.orders.splice(order11Index, 1);
      batch1.orders.splice(order12Index - 1, 0);
      batch2.orders.push(order11, order12);
      batch2.total =
        batch2.total +
        getOrderTotalItems(order11) +
        getOrderTotalItems(order12) -
        getOrderTotalItems(order2);
      batch1.orders.push(order2);
      batch1.total =
        batch1.total +
        getOrderTotalItems(order2) -
        getOrderTotalItems(order11) -
        getOrderTotalItems(order12);
    }

    return isImproved;
  }

  movePhase2() {
    //const batchesCopy = JSON.parse(JSON.stringify(this.batches));
    const batchesCopy = this.batches;
    const bestMove = {
      sourceBatch: null,
      orderToMoveIndex: null,
      orderToMove: null,
      destinationBatch: null,
    };
    let isImproved = false;
    let bestValue = this.fitnessValue;
    batchesCopy.forEach((sourceBatch, sourceBatchIndex) => {
      sourceBatch.orders.forEach((order, orderIndexInBatch) => {
        batchesCopy.forEach((destinationBatch, destinationBatchIndex) => {
          if (
            sourceBatchIndex !== destinationBatchIndex &&
            destinationBatch.total + getOrderTotalItems() <=
              this.pickingCapacity
          ) {
            // move
            sourceBatch.orders.splice(orderIndexInBatch, 1);
            sourceBatch.total -= getOrderTotalItems(order);
            destinationBatch.orders.push(order);
            destinationBatch.total += getOrderTotalItems(order);
            // compare with current bestValue
            const value = this.calculateFitness(batchesCopy);
            if (value < bestValue) {
              bestValue = value;
              bestMove.sourceBatch = sourceBatch;
              bestMove.orderToMove = order;
              bestMove.orderToMoveIndex = orderIndexInBatch;
              bestMove.destinationBatch = destinationBatch;
              isImproved = true;
            }
            // restore
            sourceBatch.orders.splice(orderIndexInBatch, 0, order);
            sourceBatch.total += getOrderTotalItems(order);
            destinationBatch.orders.pop();
            destinationBatch.total -= getOrderTotalItems(order);
          }
        });
      });
    });

    if (isImproved) {
      const { sourceBatch, orderToMoveIndex, orderToMove, destinationBatch } =
        bestMove;
      sourceBatch.orders.splice(orderToMoveIndex, 1);
      sourceBatch.total -= getOrderTotalItems(orderToMove);
      destinationBatch.orders.push(orderToMove);
      destinationBatch.total += getOrderTotalItems(orderToMove);
      this.fitnessValue = bestValue;
    }

    return isImproved;
  }

  swap11Phase2() {
    const batchesCopy = this.batches;
    const bestMove = {
      batch1: null,
      order1: null,
      order1Index: null,
      batch2: null,
      order2: null,
      order2Index: null,
    };
    let isImproved = false;
    let bestValue = this.fitnessValue;
    batchesCopy.forEach((batch1, batch1Index) => {
      batch1.orders.forEach((order1, order1Index) => {
        batchesCopy.forEach((batch2, batch2Index) => {
          if (batch1Index !== batch2Index) {
            batch2.orders.forEach((order2, order2Index) => {
              if (
                batch1.total +
                  getOrderTotalItems(order2) -
                  getOrderTotalItems(order1) <=
                  this.pickingCapacity &&
                batch2.total +
                  getOrderTotalItems(order1) -
                  getOrderTotalItems(order2) <=
                  this.pickingCapacity
              ) {
                // swap 1 - 1
                batch1.orders.splice(order1Index, 1);
                batch2.orders.splice(order2Index, 1);
                batch1.orders.splice(order1Index, 0, order2);
                batch1.total =
                  batch1.total +
                  getOrderTotalItems(order2) -
                  getOrderTotalItems(order1);
                batch2.orders.splice(order2Index, 0, order1);
                batch2.total =
                  batch2.total +
                  getOrderTotalItems(order1) -
                  getOrderTotalItems(order2);
                // compare with current bestValue
                const value = this.calculateFitness(batchesCopy);
                if (value < bestValue) {
                  bestValue = value;
                  isImproved = true;
                  bestMove.batch1 = batch1;
                  bestMove.order1Index = order1Index;
                  bestMove.order1 = order1;
                  bestMove.batch2 = batch2;
                  bestMove.order2Index = order2Index;
                  bestMove.order2 = order2;
                }
                // restore
                batch1.orders.splice(order1Index, 1);
                batch2.orders.splice(order2Index, 1);
                batch1.orders.splice(order1Index, 0, order1);
                batch1.total =
                  batch1.total -
                  getOrderTotalItems(order2) +
                  getOrderTotalItems(order1);
                batch2.orders.splice(order2Index, 0, order2);
                batch2.total =
                  batch2.total -
                  getOrderTotalItems(order1) +
                  getOrderTotalItems(order2);
              }
            });
          }
        });
      });
    });

    if (isImproved) {
      const { order1, order1Index, batch1, batch2, order2, order2Index } =
        bestMove;
      this.fitnessValue = bestValue;
      batch1.orders.splice(order1Index, 1);
      batch2.orders.splice(order2Index, 1);
      batch1.orders.splice(order1Index, 0, order2);
      batch1.total =
        batch1.total + getOrderTotalItems(order2) - getOrderTotalItems(order1);
      batch2.orders.splice(order2Index, 0, order1);
      batch2.total =
        batch2.total + getOrderTotalItems(order1) - getOrderTotalItems(order2);
    }

    return isImproved;
  }

  swap12Phase2() {
    const batchesCopy = this.batches;
    const bestMove = {
      batch1: null,
      order1: null,
      order1Index: null,
      batch2: null,
      order21: null,
      order21Index: null,
      order22: null,
      order22Index: null,
    };
    let isImproved = false;
    let bestValue = this.fitnessValue;
    batchesCopy.forEach((batch1, batch1Index) => {
      batch1.orders.forEach((order1, order1Index) => {
        batchesCopy.forEach((batch2, batch2Index) => {
          if (batch1Index !== batch2Index) {
            for (let i = 0; i < batch2.orders.length - 1; i++) {
              for (let j = i + 1; j < batch2.orders.length; j++) {
                const order21 = batch2.orders[i];
                const order22 = batch2.orders[j];
                if (
                  batch1.total +
                    getOrderTotalItems(order21) +
                    getOrderTotalItems(order22) -
                    getOrderTotalItems(order1) <=
                    this.pickingCapacity &&
                  batch2.total +
                    getOrderTotalItems(order1) -
                    getOrderTotalItems(order21) -
                    getOrderTotalItems(order22) <=
                    this.pickingCapacity
                ) {
                  // backup
                  const orders1Backup = JSON.parse(
                    JSON.stringify(batch1.orders)
                  );
                  const orders2Backup = JSON.parse(
                    JSON.stringify(batch2.orders)
                  );
                  // swap 1 - 2
                  batch1.orders.splice(order1Index, 1);
                  batch2.orders.splice(i, 1);
                  batch2.orders.splice(j - 1, 0);
                  batch1.orders.push(order21, order22);
                  batch1.total =
                    batch1.total +
                    getOrderTotalItems(order21) +
                    getOrderTotalItems(order22) -
                    getOrderTotalItems(order1);
                  batch2.orders.push(order1);
                  batch2.total =
                    batch2.total +
                    getOrderTotalItems(order1) -
                    getOrderTotalItems(order21) -
                    getOrderTotalItems(order22);
                  // compare with current bestValue
                  const value = this.calculateFitness(batchesCopy);
                  if (value < bestValue) {
                    bestValue = value;
                    isImproved = true;
                    bestMove.batch1 = batch1;
                    bestMove.order1 = order1;
                    bestMove.order1Index = order1Index;
                    bestMove.batch2 = batch2;
                    bestMove.order21 = order21;
                    bestMove.order21Index = i;
                    bestMove.order22 = order22;
                    bestMove.order22Index = j;
                  }
                  // restore
                  batch1.orders = orders1Backup;
                  batch2.orders = orders2Backup;
                  batch1.total =
                    batch1.total -
                    getOrderTotalItems(order21) -
                    getOrderTotalItems(order22) +
                    getOrderTotalItems(order1);
                  batch2.total =
                    batch2.total -
                    getOrderTotalItems(order1) +
                    getOrderTotalItems(order21) +
                    getOrderTotalItems(order22);
                }
              }
            }
          }
        });
      });
    });

    if (isImproved) {
      const {
        order1,
        order1Index,
        batch1,
        batch2,
        order21,
        order21Index,
        order22,
        order22Index,
      } = bestMove;
      this.fitnessValue = bestValue;
      batch1.orders.splice(order1Index, 1);
      batch2.orders.splice(order21Index, 1);
      batch2.orders.splice(order22Index - 1, 0);
      batch1.orders.push(order21, order22);
      batch1.total =
        batch1.total +
        getOrderTotalItems(order21) +
        getOrderTotalItems(order22) -
        getOrderTotalItems(order1);
      batch2.orders.push(order1);
      batch2.total =
        batch2.total +
        getOrderTotalItems(order1) -
        getOrderTotalItems(order21) -
        getOrderTotalItems(order22);
    }

    return isImproved;
  }

  swap21Phase2() {
    const batchesCopy = this.batches;
    const bestMove = {
      batch2: null,
      order2: null,
      order2Index: null,
      batch1: null,
      order11: null,
      order11Index: null,
      order12: null,
      order12Index: null,
    };
    let isImproved = false;
    let bestValue = this.fitnessValue;
    batchesCopy.forEach((batch1, batch1Index) => {
      for (let i = 0; i < batch1.orders.length - 1; i++) {
        for (let j = i + 1; j < batch1.orders.length; j++) {
          batchesCopy.forEach((batch2, batch2Index) => {
            if (batch1Index !== batch2Index) {
              batch2.orders.forEach((order2, order2Index) => {
                const order11 = batch1.orders[i];
                const order12 = batch1.orders[j];
                if (
                  batch2.total +
                    getOrderTotalItems(order11) +
                    getOrderTotalItems(order12) -
                    getOrderTotalItems(order2) <=
                    this.pickingCapacity &&
                  batch1.total +
                    getOrderTotalItems(order2) -
                    getOrderTotalItems(order11) -
                    getOrderTotalItems(order12) <=
                    this.pickingCapacity
                ) {
                  // backup
                  const orders1Backup = JSON.parse(
                    JSON.stringify(batch1.orders)
                  );
                  const orders2Backup = JSON.parse(
                    JSON.stringify(batch2.orders)
                  );
                  // swap 2 - 1
                  batch2.orders.splice(order2Index, 1);
                  batch1.orders.splice(i, 1);
                  batch1.orders.splice(j - 1, 0);
                  batch2.orders.push(order11, order12);
                  batch2.total =
                    batch2.total +
                    getOrderTotalItems(order11) +
                    getOrderTotalItems(order12) -
                    getOrderTotalItems(order2);
                  batch1.orders.push(order2);
                  batch1.total =
                    batch1.total +
                    getOrderTotalItems(order2) -
                    getOrderTotalItems(order11) -
                    getOrderTotalItems(order12);
                  // compare with current bestValue
                  const value = this.calculateFitness(batchesCopy);
                  if (value < bestValue) {
                    bestValue = value;
                    isImproved = true;
                    bestMove.batch1 = batch1;
                    bestMove.order2 = order2;
                    bestMove.order2Index = order2Index;
                    bestMove.batch2 = batch2;
                    bestMove.order11 = order11;
                    bestMove.order11Index = i;
                    bestMove.order12 = order12;
                    bestMove.order12Index = j;
                  }
                  // restore
                  batch1.orders = orders1Backup;
                  batch2.orders = orders2Backup;
                  batch2.total =
                    batch2.total -
                    getOrderTotalItems(order11) -
                    getOrderTotalItems(order12) +
                    getOrderTotalItems(order2);
                  batch1.total =
                    batch1.total -
                    getOrderTotalItems(order2) +
                    getOrderTotalItems(order11) +
                    getOrderTotalItems(order12);
                }
              });
            }
          });
        }
      }
    });

    if (isImproved) {
      const {
        batch1,
        batch2,
        order11,
        order11Index,
        order12,
        order12Index,
        order2,
        order2Index,
      } = bestMove;
      this.fitnessValue = bestValue;
      batch2.orders.splice(order2Index, 1);
      batch1.orders.splice(order11Index, 1);
      batch1.orders.splice(order12Index - 1, 0);
      batch2.orders.push(order11, order12);
      batch2.total =
        batch2.total +
        getOrderTotalItems(order11) +
        getOrderTotalItems(order12) -
        getOrderTotalItems(order2);
      batch1.orders.push(order2);
      batch1.total =
        batch1.total +
        getOrderTotalItems(order2) -
        getOrderTotalItems(order11) -
        getOrderTotalItems(order12);
    }

    return isImproved;
  }

  improve() {
    // phase 1
    // move operation
    let isImproved = true;
    while (isImproved) {
      isImproved = this.movePhase1();
    }

    // swap11 operation
    isImproved = true;
    while (isImproved) {
      isImproved = this.swap11Phase1();
    }

    // swap12 operation
    isImproved = true;
    while (isImproved) {
      isImproved = this.swap12Phase1();
    }

    // swap21 operation
    isImproved = true;
    while (isImproved) {
      isImproved = this.swap21Phase1();
    }

    // phase 2
    do {
      isImproved = false;
      isImproved = isImproved || this.movePhase2();
      isImproved = isImproved || this.swap11Phase2();
      isImproved = isImproved || this.swap12Phase2();
      isImproved = isImproved || this.swap21Phase2();
    } while (isImproved);

    // update the chromosome
    this.batches.forEach((batch, batchIndex) => {
      batch.orders.forEach((order) => {
        this.chromosome[+order] = batchIndex;
      });
    });
  }

  calculateFitness(batches) {
    let fitnessValue = 0;

    batches.forEach((batch) => {
      const pickList = [];
      batch.orders.forEach((order) => {
        pickList.push(...getOrderItemsList(order, orderss));
      });
      fitnessValue += calculateDistance(pickList);
    });

    return fitnessValue;
  }

  calculateUnFitness(batches) {
    let unfitnessValue = 0;

    batches.forEach((batch) => {
      unfitnessValue += Math.max(0, batch.total - this.pickingCapacity);
    });

    return unfitnessValue;
  }
}

class Population {
  constructor(orders, pickingCapacity, populationSize, numberOfBatches) {
    this.members = [];
    this.pickingCapacity = pickingCapacity;
    this.numberOfBatches = numberOfBatches;
    this.orders = orders;

    for (let i = 0; i < populationSize; i++) {
      const { chromosome, batches } = seed(
        numberOfBatches,
        orders.length,
        pickingCapacity
      );
      this.members.push(new Individual(chromosome, batches, pickingCapacity));
    }
  }

  generateMatingPool() {
    const matingPool = [];
    this.members.forEach((member) => {
      matingPool.push(member, member);
    });

    return matingPool;
  }

  // uniform crossover with mixing ratio is 0.6
  crossover(parentChromosome1, parentChromosome2) {
    const childChromosome = [];
    for (let i = 0; i < parentChromosome1.length; i++) {
      const random = Math.random();
      childChromosome[i] =
        random > 0.4 ? parentChromosome1[i] : parentChromosome2[i];
    }

    return childChromosome;
  }

  reproduce(matingPool) {
    const offsprings = [];
    for (let i = 0; i < this.members.length; i++) {
      const parent1 = matingPool[Math.floor(Math.random() * matingPool.length)];
      const parent2 = matingPool[Math.floor(Math.random() * matingPool.length)];
      const childChromosome1 = this.crossover(
        parent1.chromosome,
        parent2.chromosome
      );
      const childChromosome2 = this.crossover(
        parent1.chromosome,
        parent2.chromosome
      );
      offsprings.push(
        new Individual(
          childChromosome1,
          findBatches(childChromosome1, this.numberOfBatches),
          this.pickingCapacity
        )
      );
      offsprings.push(
        new Individual(
          childChromosome2,
          findBatches(childChromosome2, this.numberOfBatches),
          this.pickingCapacity
        )
      );
    }

    return offsprings;
  }

  sort(array) {
    array.sort((a, b) => a.unfitnessValue - b.unfitnessValue);
    let lastFeasibleIndex = 0;
    for (let i = 0; i < array.length; i++) {
      if (array[i].unfitnessValue !== 0) {
        lastFeasibleIndex = i - 1;
        break;
      }
    }
    const range = array.slice(0, lastFeasibleIndex + 1);
    range.sort((a, b) => a.fitnessValue - b.fitnessValue);
    array.splice(0, range.length, ...range);
  }

  evolve(generationsNum) {
    for (let i = 0; i < generationsNum; i++) {
      const matingPool = this.generateMatingPool();
      const offsprings = this.reproduce(matingPool);
      this.sort(this.members);
      this.sort(offsprings);
      const populationSize = this.members.length;
      const numFromOldPop = Math.floor(populationSize * 0.2);
      const numFromOffSpring = Math.floor(populationSize * 0.6);
      const numFromImmigration =
        populationSize - numFromOldPop - numFromOffSpring;
      const newMembers = this.members.slice(0, numFromOldPop);
      newMembers.push(...offsprings.slice(0, numFromOffSpring));
      // immigration
      const immigration = [];
      for (let i = 0; i < numFromImmigration; i++) {
        const { chromosome, batches } = seed(
          this.numberOfBatches,
          this.orders.length,
          this.pickingCapacity
        );
        immigration.push(
          new Individual(chromosome, batches, this.pickingCapacity)
        );
      }
      newMembers.push(...immigration);
      this.members = newMembers;
    }
  }
}

const geneticAlgorithm = (pickingCapacity, orders) => {
  const totalItems = orders.reduce((sum, current) => {
    return (
      sum +
      current.products.reduce((sum2, current2) => {
        return sum2 + current2.quantity;
      }, 0)
    );
  }, 0);
  orderss = orders;
  const numberOfBatches = Math.ceil(totalItems / pickingCapacity);
  const populationSize = 20 + orders.length / 2;
  const generationsNum = 40 + Math.ceil(orders.length / 3);
  const population = new Population(
    orders,
    pickingCapacity,
    populationSize,
    numberOfBatches
  );
  population.evolve(generationsNum);
  population.members.sort((a, b) => a.fitnessValue - b.fitnessValue);
  return population.members[0].fitnessValue;
};

module.exports = geneticAlgorithm;
