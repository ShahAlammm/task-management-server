const express = require("express");
const app = express();
const cors = require("cors");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ymhbsfp.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const usersCollection = client.db("taskDB").collection("users");
    const userCollection = client.db("taskDB").collection("newUser");
    const taskCollection = client.db("taskDB").collection("tasks");
    const reviewCollection = client.db("taskDB").collection("reviews");

    // jwt related api
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1h",
      });
      res.send({ token });
    });

    // middlewares
    const verifyToken = (req, res, next) => {
      if (!req.headers.authorization) {
        // Redirect to login page
        return res.redirect("/login");
      }

      const token = req.headers.authorization.split(" ")[1];
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
          // Redirect to login page
          return res.redirect("/login");
        }
        req.decoded = decoded;
        next();
      });
    };

    // users related api
    app.get("/users", async (req, res) => {
      const result = await usersCollection.find().toArray();
      res.send(result);
    });
    app.post("/newUser", async (req, res) => {
      const user = req.body;
      // you can do this many ways (1. email unique, 2. upsert 3. simple checking)
      const query = { email: user.email };
      const existingUser = await userCollection.findOne(query);
      if (existingUser) {
        return res.send({ message: "user already exists", insertedId: null });
      }
      const result = await userCollection.insertOne(user);
      res.send(result);
    });

    // Task related api
    app.get("/tasks/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await taskCollection.findOne(query);
      res.send(result);
    });

    app.get("/tasks", async (req, res) => {
      const result = await taskCollection.find().toArray();
      res.send(result);
    });

    app.patch("/tasks/:id", async (req, res) => {
      const item = req.body;
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: {
          title: item.title,
          description: item.description,
          status: item.status,
        },
      };

      const result = await taskCollection.updateOne(filter, updatedDoc);
      res.send(result);
    });

    app.delete('/tasks/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await taskCollection.deleteOne(query);
      res.send(result);
    })

    app.get("/reviews", async (req, res) => {
      const result = await reviewCollection.find().toArray();
      res.send(result);
    });

    app.post("/newUser", async (req, res) => {
      const newUser = req.body;
      const result = await userCollection.insertOne(newUser);
      res.send(result);
    });
    app.post("/tasks", async (req, res) => {
      const item = req.body;
      const result = await taskCollection.insertOne(item);
      res.send(result);
    });

    // app.patch('/menu/:id', async (req, res) => {
    //   const item = req.body;
    //   const id = req.params.id;
    //   const filter = { _id: new ObjectId(id) }
    //   const updatedDoc = {
    //     $set: {
    //       name: item.name,
    //       category: item.category,
    //       price: item.price,
    //       recipe: item.recipe,
    //       image: item.image
    //     }
    //   }

    //   const result = await menuCollection.updateOne(filter, updatedDoc)
    //   res.send(result);
    // })

    // app.delete('/menu/:id', verifyToken, verifyAdmin, async (req, res) => {
    //   const id = req.params.id;
    //   const query = { _id: new ObjectId(id) }
    //   const result = await menuCollection.deleteOne(query);
    //   res.send(result);
    // })

    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    // console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Server is running...");
});

app.listen(port, () => {
  console.log(`server is running on port ${port}`);
});
