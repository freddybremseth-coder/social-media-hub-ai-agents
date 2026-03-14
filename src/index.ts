import express from 'express';
import mongoose from 'mongoose'; // Assuming MongoDB for example
import { CronJob } from 'cron';
import apiRoutes from './routes/api'; // Adjust the path according to your structure

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database Connection
const DB_URI = process.env.DB_URI || 'mongodb://localhost:27017/social_media_hub';
mongoose.connect(DB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Database connected successfully'))
    .catch(err => console.error('Database connection error:', err));

// Scheduler Setup
const job = new CronJob('* * * * *', () => {
    console.log('Scheduler running every minute');
    // Add your scheduled tasks here
});
job.start();

// API Route Mounting
app.use('/api', apiRoutes);

// Start the Server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
