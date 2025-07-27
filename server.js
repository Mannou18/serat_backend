const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const swaggerUi = require('swagger-ui-express');
const specs = require('./swagger');
const authRoutes = require('./src/routes/auth');
const productRoutes = require('./src/routes/productRoutes');
const categoryRoutes = require('./src/routes/categoryRoutes');
const customerRoutes = require('./src/routes/customerRoutes');
const carRoutes = require('./src/routes/carRoutes');
const carBrandRoutes = require('./src/routes/carBrandRoutes');
const saleRoutes = require('./src/routes/saleRoutes');
const serviceRoutes = require('./src/routes/serviceRoutes');
const authController = require('./src/controllers/authController');
const neotrackRoutes = require('./src/routes/neotrackRoutes');
const logRoutes = require('./src/routes/logRoutes');
const statsRoutes = require('./src/routes/statsRoutes');
const venteRoutes = require('./src/routes/venteRoutes');
const installmentRoutes = require('./src/routes/installmentRoutes');

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
app.use('/api/ventes', venteRoutes);
app.use('/api/installments', installmentRoutes);

// Swagger setup
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// Optional root handler for /api
app.get('/api', (req, res) => {
  res.send('API is running...');
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));