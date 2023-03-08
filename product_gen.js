const products = [];

for (let i = 0; i < 30; i++) {
  const product = {
    product_id: i + 1,
    row: Math.floor(Math.random() * 15),
    column: Math.floor(Math.random() * 8),
  };
  products.push(product);
}

console.log(products);
