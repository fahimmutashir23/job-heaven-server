const express = require("express");
const app = express();
const cors = require("cors");
const jwt = require("jsonwebtoken");
const cookies = require("cookie-parser");
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require("dotenv").config();
const port = process.env.PORT || 5000;


app.use(cors({
    origin : 'http://localhost:5173',
    credentials: true
}))
app.use(express.json())
app.use(cookies())





const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.pyhg6t2.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

//middleWere
const verifyToken = (req, res, next) => {
    const token = req?.cookies?.token;
    if(!token){
        return res.status(401).send({massage: 'unauthorize access'})
    } 
    jwt.verify(token, process.env.SECRET_TOKEN, (err, decoded) => {
        if(err){
            return res.status(403).send({massage : "unauthorize access"})
        } 
        req.user = decoded
        next()
    })  
}


async function run() {
  try {
    await client.connect();
    
    const jobs = client.db("jobHeaven").collection("jobs");
    const category = client.db("jobHeaven").collection("category");
    const applyJob = client.db("jobHeaven").collection("applyJob");
    const customer = client.db("jobHeaven").collection("customer");


    app.post("/jwt", async(req, res) => {
        const user = req.body;
        const token = jwt.sign(user, process.env.SECRET_TOKEN, {expiresIn: "1h"})
        res.cookie('token', token, {
            httpOnly: true,
            secure: true,
            sameSite: "none"
        })
        .send({'success': true})
    })

    app.post("/logOut", async(req, res) => {
        res.clearCookie('token', {maxAge: 0}).send({'success': true})
    })

   
    app.get("/jobs", async(req, res) => {
       let query = {};
       if(req?.query?.category){
        query = {category: req.query.category}
       }
        else if(req.query.email){
        query = {email: req.query.email}
       }
        const result = await jobs.find(query).toArray();
        res.send(result)
    })

    app.get("/customer", async(req, res) => {
        const result = await customer.find().toArray();
        res.send(result);
    })

    // app.get("/customer", async(req, res)=> {
    //     let query = {};
    //     if(req.query?.review){
    //         query = {short_review: req.query.review}
    //     }
    //     const result = await customer.find(query).toArray();
    //     res.send(result)
    // })
    
   
    app.get("/jobs/:id", async(req, res)=> { 
        const id = req.params.id;
        const query = {_id: new ObjectId(id)}
        const result = await jobs.findOne(query)
        res.send(result)
    })

    app.get("/category", async(req, res) => {
        const result = await category.find().toArray()
        res.send(result)
    })

    app.get("/applyJob", verifyToken, async(req, res) => {

        if(req?.user?.email !== req?.query?.email) {
            return res.status(401).send({massage: 'unauthorize User'})
        }
        let query = {};
        if(req?.query?.email){
            query = {email: req?.query?.email}
        }
        const result = await applyJob.find(query).toArray()
        res.send(result)
    })

    app.post("/jobs", async(req, res) => {
        const data = req.body;
        const result = await jobs.insertOne(data)
        res.send(result)
    })

    app.post("/applyJob", async(req, res) => {
        const query = req.body;
        const result = await applyJob.insertOne(query);
        res.send(result);
    })

    app.put("/jobs/:job_title", async(req, res) => {
        const query = req.params.job_title
        const filter = {job_title: query}
        const result = await jobs.updateOne(filter, {$inc: {"jobNumber" : 1}})
        res.send(result)
    })

    app.put("/jobs/:id", async(req, res) => {
        const data = req.body;
        const id = req.params.id;
        const filter = {_id: new ObjectId(id)};
        const options = {upsert: true};
        const updateDoc = {
            $set: {
                name: data.name,
                category: data.category,
                deadline: data.deadline,
                description: data.description,
                job_title: data.job_title,
                photo: data.photo,
                postingDate: data.postingDate,
                salary: data.salary,
            }
        }
        const result = await jobs.updateOne(filter, updateDoc, options);
        res.send(result)
    })

    app.delete("/jobs/:id", async(req, res) => {
        const id = req.params.id;
        const query = {_id: new ObjectId(id)};
        const result = await jobs.deleteOne(query);
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
