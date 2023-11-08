const express = require('express');
const cors = require('cors');
require('dotenv').config()
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');


const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors({
    origin: ['https://hire-ly.web.app'],
    credentials: true
}))
app.use(express.json());
app.use(cookieParser());





const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.owknkgr.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();

        const JobCollections = client.db('jobDB').collection('job');
        const applicationCollections = client.db('applicationDB').collection('application');

        // auth api
        app.post('/jwt', async(req, res) => {
            const user = req.body;
            const token = jwt.sign(user, `${process.env.ACCESS_TOKEN_SECRET}`, {expiresIn: '1h'})
            console.log(user);
            res
            .cookie('token', token, {
                httpOnly: true,
                secure: false,
            })
            .send({success: true})
        })

        // Jobs Collection
        // write jobs
        app.post('/job', async (req, res) => {
            const newJob = req.body;
            const result = await JobCollections.insertOne(newJob);
            res.send(result);
        })
        // Read Jobs
        app.get('/job', async (req, res) => {
            const cursor = JobCollections.find();
            const result = await cursor.toArray();
            res.send(result);
        })
        // single job by id
        app.get('/job/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await JobCollections.findOne(query);
            res.send(result);
        })
        // update job
        app.put('/job/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) }
            const options = { upsert: true }
            const updateJob = req.body;

            const job = {
                $set: {
                    bannerPhoto: updateJob.bannerPhoto,
                    userName: updateJob.userName,
                    jobTitle: updateJob.jobTitle,
                    userEmail: updateJob.userEmail,
                    jobType: updateJob.jobType,
                    jobCategory: updateJob.jobCategory,
                    postingDate: updateJob.postingDate,
                    deadLine: updateJob.deadLine,
                    jobDescription: updateJob.jobDescription,
                    priceRageMin: updateJob.priceRageMin,
                    priceRageMax: updateJob.priceRageMax,
                    applicantsNumber: updateJob.applicantsNumber,
                }
            }
            const result = await JobCollections.updateOne(filter, job, options);
            res.send(result);
        })
        // delete job item
        app.delete('/job/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: new ObjectId(id) }
            const result = await JobCollections.deleteOne(query)
            res.send(result)
        })
        // search job
        app.get('/search/:key', async (req, res) => {
            const key = req.params.key.toLowerCase();
            const regex = new RegExp(key, 'i')
            const result = await JobCollections.find(
                {$or: [
                    { jobTitle: regex },
                    { jobType: regex },
                ]}
            ).toArray()
            res.send(result);
        });




        // Job Application api
        app.post('/application', async (req, res) => {
            newApplication = req.body;
            console.log(req.cookies);
            const result = await applicationCollections.insertOne(newApplication);
            res.send(result);
        })
        // Read Applications
        app.get('/application', async (req, res) => {
            const cursor = applicationCollections.find();
            const result = await cursor.toArray();
            res.send(result);
        })
        // single application by id
        app.get('/application/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await applicationCollections.findOne(query);
            res.send(result);
        })

        app.get('/search-application/:key', async (req, res) => {
            const key = req.params.key.toLowerCase();
            const regex = new RegExp(key, 'i')
            const result = await applicationCollections.find(
                {$or: [
                    { jobTitle: regex },
                    { jobType: regex },
                ]}
            ).toArray()
            console.log(result);
            res.send(result);
        });



        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send("Server connected")
})
app.listen(port, () => {
    console.log(`Server running on ${port}`);
})