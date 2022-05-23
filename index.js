const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: "Unauthorized" });
  }
  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.TOKEN, function (err, decoded) {
    if (err) {
      res.status(403).send({ message: "Access Expired" });
    }
    req.decoded = decoded;
    next();
  });
}

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
    const userCollection = client.db("bicycle_odyssey").collection("users");
    app.get("/parts", async (req, res) => {
      const result = await partsCollection.find().toArray();
      res.send(result);
    });
    // get one tools
    app.get("/parts/:_id", async (req, res) => {
      const _id = req.params._id;
      const query = { _id: ObjectId(_id) };
      const result = await partsCollection.findOne(query);
      res.send(result);
    });
    // add order
    app.post("/ordered", async (req, res) => {
      const ordered = req.body;
      const result = await orderedCollection.insertOne(ordered);
      res.send(result);
    });
    // update parts
    app.put("/parts/:_id", async (req, res) => {
      const _id = req.params._id;
      const query = { _id: ObjectId(_id) };
      const updatedQuantity = req.body;
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          quantity: updatedQuantity.deliveredQuantity,
        },
      };
      const result = await partsCollection.updateOne(
        query,
        updateDoc,
        options
      );
      res.send(result);
    });
    app.get("/users", verifyJWT, async (req, res) => {
      const users = await userCollection.find().toArray();
      res.send(users);
    });

    app.get("/admin/:email", async (req, res) => {
      const email = req.params.email;
      console.log(email)
      const user = await userCollection.findOne({ email: email });
      const isAdmin = user.role === "admin";
      res.send({ admin: isAdmin });
    });

    app.put("/user/admin/:email", verifyJWT, async (req, res) => {
      const email = req.params.email;
      const requester = req.decoded.email;
      const requesterAccount = await userCollection.findOne({
        email: requester,
      });
      if (requesterAccount.role === "admin") {
        const filter = { email: email };
        const updateDoc = {
          $set: { role: "admin" },
        };
        const result = await userCollection.updateOne(filter, updateDoc);
        res.send({ result });
      } else {
        res.status(403).send({ message: "Access Denied" });
      }
    });

    app.put("/user/:email", async (req, res) => {
      const email = req.params.email;
      const user = req.body;
      const filter = { email: email };
      const options = { upsert: true };
      const updateDoc = {
        $set: user,
      };
      const result = await userCollection.updateOne(filter, updateDoc, options);
      var token = jwt.sign({ email: email }, process.env.TOKEN, {
        expiresIn: "1h",
      });
      res.send({ result, token });
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
