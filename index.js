const express = require("express");
const app = express();
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require("dotenv").config();
const port = process.env.PORT || 5000;


app.use(cors())
app.use(express.json())




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.pyhg6t2.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    await client.connect();
    const jobs = client.db("jobHeaven").collection("jobs");
    const category = client.db("jobHeaven").collection("category");

   
    app.get("/jobs", async(req, res) => {
       let category = {};
       if(req?.query?.category){
        category = {category: req.query.category}
       }
        const query = await jobs.find(category).toArray();
        res.send(query)
    })

    app.get("/category", async(req, res) => {
        const result = await category.find().toArray()
        res.send(result)
    })



    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);




app.get("/", (req, res)=> {
    res.send("Job Heaven server is running successfully")
})

app.listen(port, () => {
    console.log(`server is running port ${port}`);
})
