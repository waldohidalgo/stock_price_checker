async function fetchStockData(req, res, next) {
  const { stock } = req.query;

  if (stock === undefined) {
    res.json({ stock: "Unknown symbol" });
    return;
  }

  try {
    if (Array.isArray(stock)) {
      const stockPricesQueryURL = await Promise.all(
        stock.map((stockElem) => getPrices(stockElem))
      );
      const stockPricesQueryURLFiltered = stockPricesQueryURL.filter(
        (stock) => stock !== null
      );
      if (stockPricesQueryURL.every((stock) => stock === null)) {
        res.json({ stock: "Unknown symbol" });
        return;
      }
      res.locals = {
        stockArray: stockPricesQueryURLFiltered,
      };
      next();
      return;
    }
    if (typeof stock === "string") {
      const stockPriceQueryURL = await getPrices(stock);
      if (stockPriceQueryURL === null) {
        res.json({ stock: "Unknown symbol" });
        return;
      }
      res.locals = { stockArray: [stockPriceQueryURL] };
      next();
      return;
    }

    res.json({ stock: "Unknown symbol" });
    return;
  } catch (error) {
    res.send(error);
  }
}

async function getPrices(stock) {
  const urlStockQuery = "https://stock-price-checker-proxy.freecodecamp.rocks";
  try {
    const responseStockQueryURL = await fetch(
      `${urlStockQuery}/v1/stock/${stock}/quote`
    );

    if (responseStockQueryURL.status === 200) {
      const stockDataQueryURL = await responseStockQueryURL.json();
      if (
        stockDataQueryURL === "Unknown symbol" ||
        stockDataQueryURL === "Invalid symbol"
      ) {
        return null;
      }
      return {
        stock: stock.toLowerCase(),
        price: stockDataQueryURL.latestPrice,
      };
    }

    return null;
  } catch (error) {
    return null;
  }
}

module.exports = fetchStockData;
