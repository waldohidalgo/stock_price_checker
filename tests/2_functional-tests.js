const chaiHttp = require("chai-http");
const chai = require("chai");
const assert = chai.assert;
const server = require("../server");
const dbObject = require("../config/db.js");
const { ObjectId } = require("mongodb");

chai.use(chaiHttp);

suite("Functional Tests", function () {
  // Viewing one stock: GET request to /api/stock-prices/

  let likes = null;

  test("Viewing one stock: GET request to /api/stock-prices/", function (done) {
    chai
      .request(server)
      .keepOpen()
      .get("/api/stock-prices?stock=GOOG")
      .end(function (err, res) {
        likes = res.body.stockData.likes;
        assert.equal(res.status, 200);
        assert.isString(res.body.stockData.stock);
        assert.isNumber(res.body.stockData.price);
        assert.isNumber(res.body.stockData.likes);
        done();
      });
  });

  // Viewing one stock and liking it: GET request to /api/stock-prices/

  test("Viewing one stock and liking it: GET request to /api/stock-prices/", function (done) {
    chai
      .request(server)
      .keepOpen()
      .get("/api/ip")
      .end(async (err, res) => {
        const id = res.body.id;

        const ipsCollection = dbObject.db.collection("ips");
        if (id) {
          await ipsCollection.deleteOne({
            _id: new ObjectId(String(id)),
          });
        }

        chai
          .request(server)
          .keepOpen()
          .get("/api/stock-prices?stock=GOOG&like=true")
          .end(function (err, res) {
            assert.equal(res.status, 200);
            assert.isString(res.body.stockData.stock);
            assert.isNumber(res.body.stockData.price);
            assert.isNumber(res.body.stockData.likes);
            // likes should be increased by 1
            assert.equal(likes + 1, res.body.stockData.likes);
            likes = likes + 1;
            done();
          });
      });
  });

  // Viewing the same stock and liking it again: GET request to /api/stock-prices/

  test("Viewing the same stock and liking it again: GET request to /api/stock-prices/", function (done) {
    chai
      .request(server)
      .keepOpen()
      .get("/api/stock-prices?stock=GOOG&like=true")
      .end(function (err, res) {
        assert.equal(res.status, 200);
        assert.isString(res.body.stockData.stock);
        assert.isNumber(res.body.stockData.price);
        assert.isNumber(res.body.stockData.likes);
        // likes should be the same
        assert.equal(likes, res.body.stockData.likes);
        done();
      });
  });
  // Viewing two stocks: GET request to /api/stock-prices/

  let likes1 = null;
  let likes2 = null;

  test("Viewing two stocks: GET request to /api/stock-prices/", function (done) {
    chai
      .request(server)
      .keepOpen()
      .get("/api/stock-prices?stock=GOOG")
      .end(function (err, res) {
        likes1 = res.body.stockData.likes;

        chai
          .request(server)
          .keepOpen()
          .get("/api/stock-prices?stock=MSFT")
          .end(function (err, res) {
            likes2 = res.body.stockData.likes;

            chai
              .request(server)
              .keepOpen()
              .get("/api/stock-prices?stock=GOOG&stock=MSFT")
              .end(function (err, res) {
                assert.equal(res.status, 200);
                assert.isObject(res.body.stockData[0]);
                assert.isObject(res.body.stockData[1]);

                assert.property(res.body.stockData[0], "rel_likes");
                assert.property(res.body.stockData[1], "rel_likes");
                assert.equal(
                  res.body.stockData[0]["rel_likes"] +
                    res.body.stockData[1]["rel_likes"],
                  0
                );

                assert.equal(
                  likes1 - likes2,
                  res.body.stockData[0]["rel_likes"]
                );
                done();
              });
          });
      });
  });

  // Viewing two stocks and liking them: GET request to /api/stock-prices/

  test("Viewing two stocks and liking them: GET request to /api/stock-prices/", function (done) {
    chai
      .request(server)
      .keepOpen()
      .get("/api/ip")
      .end(async (err, res) => {
        const id = res.body.id;

        const ipsCollection = dbObject.db.collection("ips");
        if (id) {
          await ipsCollection.deleteOne({
            _id: new ObjectId(String(id)),
          });
        }

        chai
          .request(server)
          .keepOpen()
          .get("/api/stock-prices?stock=GOOG&stock=MSFT&like=true")
          .end(function (err, res) {
            assert.equal(res.status, 200);
            const stockData1 = res.body.stockData[0];
            const stockData2 = res.body.stockData[1];
            assert.isObject(stockData1);
            assert.isObject(stockData2);

            assert.property(stockData1, "rel_likes");
            assert.property(stockData2, "rel_likes");
            assert.equal(stockData1["rel_likes"] + stockData2["rel_likes"], 0);
            assert.equal(likes1 - likes2, stockData1["rel_likes"]);
            done();
          });
      });
  });
});
