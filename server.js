const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const swaggerUi = require('swagger-ui-express');
const specs = require('./swagger');
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/productRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const customerRoutes = require('./routes/customerRoutes');
const carRoutes = require('./routes/carRoutes');
const carBrandRoutes = require('./routes/carBrandRoutes');
const saleRoutes = require('./routes/saleRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const authController = require('./controllers/authController');
const neotrackRoutes = require('./routes/neotrackRoutes');
const logRoutes = require('./routes/logRoutes');
const statsRoutes = require('./routes/statsRoutes');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Public routes (no authentication required)
app.post('/api/login', authController.login);

// Protected routes (authentication required)
app.use('/api/auth', authRoutes);
app.use('/api/product', productRoutes);
app.use('/api/category', categoryRoutes);
app.use('/api/customer', customerRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/car', carRoutes);
app.use('/api/cars', carRoutes);
app.use('/api/car-brands', carBrandRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/neotracks', neotrackRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/stats', statsRoutes);

// Swagger setup
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// Optional root handler for /api
app.get('/api', (req, res) => {
  res.send('API is running...');
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));