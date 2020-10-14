const express = require('express')
const bodyParser = require('body-parser');
const cors = require('cors')
const MongoClient = require('mongodb').MongoClient;
const fileUpload = require('express-fileupload')
const admin = require('firebase-admin');
const ObjectId = require('mongodb').ObjectId;
require('dotenv').config();

// use app
const app = express()
app.use(bodyParser.urlencoded({
  extended: false
}));
app.use(bodyParser.json());
app.use(cors())
app.use(express.static('servicePhoto'))
app.use(fileUpload())

const serviceAccount = require("./creative-agency-a1c8c-firebase-adminsdk-dwuw0-319af5f287.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://creative-agency-a1c8c.firebaseio.com"
});

const uri = "mongodb+srv://piasUser:tNvcfkBDmGQet6X@cluster0.bw56e.mongodb.net/creativeAgency?retryWrites=true&w=majority";
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
  const ServiceCollection = client.db("creativeAgency").collection("services");
  const UserServiceCollection = client.db("creativeAgency").collection("userServices");
  const UserReviewCollection = client.db("creativeAgency").collection("userReview");

  // Show Services in the home page
  app.get('/getServices', (req, res) => {
    ServiceCollection.find({})
      .toArray((err, documents) => {
        res.send(documents)
      })
  })
  //  Add Order in the home page
  app.post('/addOrder', (req, res) => {
    const file = req.files.file;
    const name = req.body.name;
    const email = req.body.email;
    const title = req.body.title;
    const description = req.body.description;
    const price = req.body.price;
    const newImg = file.data;
        const encImg = newImg.toString('base64');

        var image = {
            contentType: file.mimetype,
            size: file.size,
            img: Buffer.from(encImg, 'base64')
        };
        console.log(image, name, email, title, price, description)
    UserServiceCollection.insertOne({image, name, email, title, price, description})
      .then(result => {
        res.send(result.insertedCount > 0)
      })
  })
  
  // Show Services in the home page
  app.get('/getUserServices', (req, res) => {
    const bearer = req.headers.authorization;
        if (bearer && bearer.startsWith('Bearer ')) {
            const idToken = bearer.split(' ')[1];
            // idToken comes from the client app
            admin.auth().verifyIdToken(idToken)
                .then((decodedToken) => {
                    let tokenEmail = decodedToken.email;
                    UserServiceCollection.find({
                            email: tokenEmail
                        })
                        .toArray((err, documents) => {
                            res.send(documents)
                        })
                }).catch((error) => {
                    res.sendStatus(401);
                });
        } else {
            res.sendStatus(401);
        }
  })

  // Add Review
  app.post('/addReview', (req, res) => {
    const userInfo = req.body
    UserReviewCollection.insertOne(userInfo)
        .then(result => {
            res.send(result.insertedCount > 0)
            console.log(result)
        })
})
// Show Review in the home page
app.get('/getReview', (req, res) => {
  UserReviewCollection.find({})
    .toArray((err, documents) => {
      res.send(documents)
    })
})

});


app.listen(process.env.PORT || 5000);