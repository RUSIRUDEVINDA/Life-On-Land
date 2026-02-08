import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import connectDB from './config/db.js';

const app = express();

// Connect to MongoDB
connectDB();
//body parser middleware
app.use(bodyParser.json());

// cors middleware
app.use(cors());

app.get('/', (req, res) => {
    res.send('This is the backend server for Life on Land');
})

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});