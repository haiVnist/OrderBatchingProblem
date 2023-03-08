const AISLES_NUM = 8;
const SHELVES_PER_AISLE = 15;
const SHELVES_LENGTH = 2;
const DISTANCE_BETWEEN_AISLES = 1.2;
const DISTANCE_BETWEEN_DEPOT_FIRST_AISLE = 0;
const ENTIRE_AISLE_LENGTH = SHELVES_PER_AISLE * SHELVES_LENGTH;

const products = {
  0: { row: 11, column: 5 },
  1: { row: 8, column: 0 },
  2: { row: 11, column: 4 },
  3: { row: 9, column: 0 },
  4: { row: 4, column: 1 },
  5: { row: 10, column: 2 },
  6: { row: 11, column: 4 },
  7: { row: 8, column: 4 },
  8: { row: 14, column: 0 },
  9: { row: 13, column: 5 },
  10: { row: 2, column: 3 },
  11: { row: 5, column: 6 },
  12: { row: 4, column: 2 },
  13: { row: 0, column: 1 },
  14: { row: 3, column: 5 },
  15: { row: 1, column: 7 },
  16: { row: 2, column: 5 },
  17: { row: 4, column: 6 },
  18: { row: 14, column: 5 },
  19: { row: 1, column: 3 },
  20: { row: 11, column: 4 },
  21: { row: 13, column: 0 },
  22: { row: 12, column: 1 },
  23: { row: 14, column: 0 },
  24: { row: 6, column: 7 },
  25: { row: 14, column: 3 },
  26: { row: 12, column: 5 },
  27: { row: 7, column: 4 },
  28: { row: 7, column: 2 },
  29: { row: 9, column: 0 },
};

module.exports = {
  AISLES_NUM,
  SHELVES_PER_AISLE,
  SHELVES_LENGTH,
  DISTANCE_BETWEEN_AISLES,
  DISTANCE_BETWEEN_DEPOT_FIRST_AISLE,
  ENTIRE_AISLE_LENGTH,
  products,
};
