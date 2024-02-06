const express = require("express");
const cors = require("cors");
const { channelId, videoId } = require("@gonetone/get-youtube-id-by-url");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(cors());

const { MongoClient, ServerApiVersion } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_NAME}:${process.env.DB_PASS}@cluster0.fsd9z3z.mongodb.net/?retryWrites=true&w=majority`;

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
    // Connect to the "mediaMasterHub" database and access its "youtubeChannelAuthenticationID" collection
    const database = client.db("mediaMasterHub");
    const youtubeChannelAuthenticationID = database.collection("youtubeChannelAuthenticationID");
    const usersCollection = database.collection("usersCollection");

    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection

    app.get("/youtubeChannelLoginID", async (req, res) => {
      const result = await youtubeChannelAuthenticationID.find().toArray();
      res.send(result);
    });

    app.post("/youtubeChannelLogin", async (req, res) => {
      const { youtubeChannelLink, userEmail } = req.body;
      // get the youtube channel id from youtube channel link
      const youtubeChannelID = await channelId(youtubeChannelLink);

      // check if the youtube channel id already exists in the database
      const existingRecord = await youtubeChannelAuthenticationID.findOne({ youtubeChannelID });

      if (existingRecord) {
        // If the record already exists, send a response indicating that
        res.json({ success: true, youtubeChannelID });
      } else {
        // If the record does not exist, insert it into the database
        const result = await youtubeChannelAuthenticationID.insertOne({ youtubeChannelID, userEmail });
        res.json({ success: true, youtubeChannelID });
      }
    });

    app.post("/authenticationUser", async (req, res) => {
      const user = req.body;
      const query = { email: user.email };
      const existingUser = await usersCollection.findOne(query);
      if (existingUser) {
        return res.send({ message: "user already exists" });
      }
      const result = await usersCollection.insertOne(user);
      res.send(result);
    });

    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello World");
});

app.listen(port, () => {
  console.log(`Media Master Hub Server is running on PORT ${port}`);
});
