const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.USER}:${process.env.PASS}@bicycle-odyssey.snj10.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
  try {
    await client.connect();
    const partsCollection = client.db("bicycle_odyssey").collection("parts");
    const orderedCollection = client.db("bicycle_odyssey").collection("orderd");
    app.get("/parts", async (req, res) => {
      const result = await partsCollection.find().toArray();
      res.send(result);
    });
    // get one tools
    app.get("/parts/:_id", async (req, res) => {
      const _id = req.params._id;
      const query = {_id: ObjectId(_id)}
      const result = await partsCollection.findOne(query);
      res.send(result);
    });
    // add order
    app.post("/ordered", async (req, res) => {
      const ordered = req.body;
      const result = await orderedCollection.insertOne(ordered);
      res.send(result);
    });
  } finally {
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello bicycle odyssey!");
});

app.listen(port, () => {
  console.log(`bicycle app listening on port ${port}`);
});
