// configurar dotenv
require("dotenv").config();
const { MongoClient } = require("mongodb");

const { MONGODB_LOCAL } = process.env;

class Db {
  constructor() {
    this.client = new MongoClient(MONGODB_LOCAL);
  }

  async connect() {
    await this.client.connect();
    this.db = this.client.db("stock_price_checker_freecodecamp");
    console.log("Connected to MongoDB");
  }
}

module.exports = new Db();
