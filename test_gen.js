class Order {
  constructor(orderId, products, totalItems) {
    this.orderId = orderId;
    this.products = products;
    this.totalItems = totalItems;
  }
}

const generateOrders = (numberOfOrders) => {
  const orders = [];
  let count = 0;
  while (count < numberOfOrders) {
    const maxTotal = Math.floor(Math.random() * 9 + 2);
    let remainingCapacity = maxTotal;
    let totalItems = 0;
    const usedProduct = [];
    const products = [];
    while (remainingCapacity > 0) {
      let productId = Math.floor(Math.random() * 30);
      while (usedProduct.includes(productId)) {
        productId = Math.floor(Math.random() * 30);
      }
      const quantity = Math.floor(Math.random() * remainingCapacity) + 1;
      products.push({ productId, quantity });
      usedProduct.push(productId);
      totalItems += quantity;
      remainingCapacity -= quantity;
    }
    orders.push(new Order(count, products, totalItems));
    count++;
  }

  return orders;
};

module.exports = generateOrders;
