"use strict";
const dbObject = require("../config/db.js");
const fetchStockData = require("../middlewares/fetchStockData.js");
const bcrypt = require("bcrypt");
module.exports = function (app) {
  const stocksCollection = dbObject.db.collection("stocks");
  const ipsCollection = dbObject.db.collection("ips");

  async function checkIfIPexistsInDB(ipsCollection, ip) {
    const documentosIP = await ipsCollection.find({}).toArray();
    for (let doc of documentosIP) {
      if (await bcrypt.compare(ip, doc.ip)) return true;
    }
    return false;
  }
  app.get("/api/ip", async (req, res) => {
    const ip = req.ip;
    const ipsCollection = dbObject.db.collection("ips");

    const arrayIps = await ipsCollection.find({}).toArray();

    for (let doc of arrayIps) {
      const result = await bcrypt.compare(ip, doc.ip);
      if (result) {
        return res.json({ id: doc._id });
      }
    }
    res.json({ error: "IP not found" });
  });

  app.route("/api/stock-prices").get(fetchStockData, async (req, res) => {
    const { stockArray } = res.locals;
    const { like } = req.query;
    const ip = req.ip;

    try {
      if (like === "true") {
        const responseIpsQuery = await checkIfIPexistsInDB(ipsCollection, ip);
        if (responseIpsQuery) {
          crearStockORetornarla(stocksCollection, stockArray, res);
          return;
        }
        crearIPyAumentarLikes(
          ipsCollection,
          stocksCollection,
          ip,
          stockArray,
          res
        );
        return;
      }
      if (like === "false" || like === undefined) {
        crearStockORetornarla(stocksCollection, stockArray, res);
        return;
      }
    } catch (error) {
      res.send(error.message);
    }
  });

  async function crearStockoRetornarlaQuery(stocksCollection, stock) {
    // si no existe stock en la base de datos crearla y si existe retornarla
    const responseCreacionStockQuery = await stocksCollection.findOneAndUpdate(
      { stock },
      { $setOnInsert: { stock, likes: 0 } },
      { upsert: true, returnDocument: "after" }
    );

    return {
      stock: responseCreacionStockQuery.stock,
      likes: responseCreacionStockQuery.likes,
    };
  }

  async function crearStockORetornarla(stocksCollection, stockArray, res) {
    if (stockArray.length === 1) {
      const responseCreacionStockQuery = await crearStockoRetornarlaQuery(
        stocksCollection,
        stockArray[0].stock
      );

      res.json({
        stockData: {
          stock: stockArray[0].stock,
          price: stockArray[0].price,
          likes: responseCreacionStockQuery.likes,
        },
      });
      return;
    }
    if (stockArray.length > 1) {
      const stock1Name = stockArray[0].stock;
      const price1 = stockArray[0].price;
      const stock2Name = stockArray[1].stock;
      const price2 = stockArray[1].price;

      const responseCreacionStockQuery = await Promise.all([
        crearStockoRetornarlaQuery(stocksCollection, stock1Name),
        crearStockoRetornarlaQuery(stocksCollection, stock2Name),
      ]);

      const diferenciaLikes =
        responseCreacionStockQuery[0].likes -
        responseCreacionStockQuery[1].likes;
      res.json({
        stockData: [
          {
            stock: stock1Name,
            price: price1,
            rel_likes: diferenciaLikes,
          },
          {
            stock: stock2Name,
            price: price2,
            rel_likes: -diferenciaLikes,
          },
        ],
      });
    }
  }

  async function crearIPyAumentarLikesQuery(stocksCollection, stockName) {
    const responseLikesQuery = await stocksCollection.findOneAndUpdate(
      { stock: stockName },
      { $inc: { likes: 1 } },
      { upsert: true, returnDocument: "after" }
    );

    return { likes: responseLikesQuery.likes };
  }
  async function crearIPyAumentarLikes(
    ipsCollection,
    stocksCollection,
    ip,
    stockArray,
    res
  ) {
    const hashIP = await bcrypt.hash(ip, 12);
    await ipsCollection.insertOne({ ip: hashIP });

    if (stockArray.length === 1) {
      const responseLikesQuery = await crearIPyAumentarLikesQuery(
        stocksCollection,
        stockArray[0].stock
      );
      res.json({
        stockData: {
          stock: stockArray[0].stock,
          price: stockArray[0].price,
          likes: responseLikesQuery.likes,
        },
      });
      return;
    }
    if (stockArray.length > 1) {
      const stock1Name = stockArray[0].stock;
      const price1 = stockArray[0].price;
      const stock2Name = stockArray[1].stock;
      const price2 = stockArray[1].price;

      const responseLikesQuery = await Promise.all([
        crearIPyAumentarLikesQuery(stocksCollection, stock1Name),
        crearIPyAumentarLikesQuery(stocksCollection, stock2Name),
      ]);

      const diferenciaLikes =
        responseLikesQuery[0].likes - responseLikesQuery[1].likes;
      res.json({
        stockData: [
          {
            stock: stock1Name,
            price: price1,
            rel_likes: diferenciaLikes,
          },
          {
            stock: stock2Name,
            price: price2,
            rel_likes: -diferenciaLikes,
          },
        ],
      });
    }
  }
};
