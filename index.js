const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const app = express();
const port = process.env.PORT || 3000;

const corsOptions = {
  origin: ["http://localhost:5173", "https://shareameal-47f80.web.app"],
  credentials: true,
  optionSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.xehxmtv.mongodb.net`;

async function run() {
  const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
  });

  try {
    const foodCollection = client.db("FoodDB").collection("foodInfo");
    const foodRequestCollection = client.db("FoodDB").collection("foodRequest");
    const userCollection = client.db("FoodDB").collection("user");

    // GET all foodInfos
    app.get("/foodInfo", async (req, res) => {
      const allWork = await foodCollection.find({}).toArray();
      res.json(allWork);
    });

    // GET one foodInfo by ID
    app.get("/foodInfo/:id", async (req, res) => {
      const id = req.params.id;
      if (!ObjectId.isValid(id)) {
        return res.status(400).json({ error: "Invalid ID format" });
      }
      const query = { _id: new ObjectId(id) };
      const result = await foodCollection.findOne(query);
      if (!result) {
        return res.status(404).json({ error: "Work not found" });
      }
      res.json(result);
    });

    // POST new foodInfo
    app.post("/foodInfo", async (req, res) => {
      const newWork = req.body;
      console.log("Your new work:", newWork);
      const result = await foodCollection.insertOne(newWork);
      res.json(result);
    });

    // GET profile by email
    app.get("/profile/:email", async (req, res) => {
      const userEmail = req.params.email;
      try {
        const userCards = await foodCollection
          .find({ user_email: userEmail })
          .toArray();
        res.json(userCards);
      } catch (error) {
        res.status(500).send("Error retrieving data");
      }
    });

    // ✅ DELETE profile item by email + ID
    app.delete("/profile/:email", async (req, res) => {
      const email = req.params.email;
      const { id } = req.body;

      if (!ObjectId.isValid(id)) {
        return res.status(400).json({ error: "Invalid ID format" });
      }

      try {
        const result = await foodCollection.deleteOne({
          _id: new ObjectId(id),
          user_email: email,
        });

        if (result.deletedCount === 0) {
          return res
            .status(404)
            .json({ error: "Item not found or not deleted" });
        }

        res.json(result);
      } catch (error) {
        console.error("Delete error:", error);
        res.status(500).json({ error: "Internal server error" });
      }
    });

    // PUT update foodInfo
    app.put("/foodInfo/:id", async (req, res) => {
      const id = req.params.id;
      if (!ObjectId.isValid(id)) {
        return res.status(400).json({ error: "Invalid ID format" });
      }
      const updatedWork = req.body;
      const query = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const result = await foodCollection.replaceOne(
        query,
        updatedWork,
        options
      );
      res.json(result);
    });

    //Requested Food

    /// GET all food requests
    app.get("/foodRequest", async (req, res) => {
      try {
        const allRequests = await foodRequestCollection.find({}).toArray();
        res.json(allRequests);
      } catch (error) {
        console.error("Error fetching all requests:", error);
        res.status(500).json({ error: "Internal Server Error" });
      }
    });

    // GET all food requests of a user
    app.get("/foodRequest/:email", async (req, res) => {
      const email = req.params.email;

      try {
        const requests = await foodRequestCollection
          .find({ requester_email: email })
          .toArray();
        res.json(requests);
      } catch (error) {
        console.error("Error fetching requests:", error);
        res.status(500).json({ error: "Internal Server Error" });
      }
    });

    // POST a new food request
    app.post("/foodRequest", async (req, res) => {
      const newRequest = req.body;
      if (!newRequest.food_id || !newRequest.requester_email) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      try {
        const result = await foodRequestCollection.insertOne(newRequest);
        res.json({ insertedId: result.insertedId });
      } catch (error) {
        console.error("Error inserting food request:", error);
        res.status(500).json({ error: "Internal Server Error" });
      }
    });

    // DELETE one food request
    app.delete("/foodRequest/:id", async (req, res) => {
      const id = req.params.id;

      if (!ObjectId.isValid(id)) {
        return res.status(400).json({ error: "Invalid ID format" });
      }

      try {
        const result = await foodRequestCollection.deleteOne({
          _id: new ObjectId(id),
        });

        if (result.deletedCount === 0) {
          return res.status(404).json({ error: "Request not found" });
        }

        res.json(result);
      } catch (error) {
        console.error("Error deleting request:", error);
        res.status(500).json({ error: "Internal Server Error" });
      }
    });

    // GET all users
    app.get("/user", async (req, res) => {
      const allUser = await userCollection.find({}).toArray();
      res.json(allUser);
    });

    // POST new user
    app.post("/user", async (req, res) => {
      const newUser = req.body;
      console.log("New user:", newUser);
      const result = await userCollection.insertOne(newUser);
      res.json(result);
    });

    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } catch (err) {
    console.error("Error connecting to MongoDB:", err);
  }
}

run().catch(console.dir);

// Root route
app.get("/", (req, res) => {
  res.send("Work making service is running...");
});

// Start the server
app.listen(port, () => {
  console.log(`Work listening on port: ${port}`);
});
