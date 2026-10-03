// Vercel Serverless Entry Point — wraps the Express backend app
// This file is the single serverless function that handles all /api/* routes

const app = require('../backend/index.js');

// Export the Express app as a Vercel serverless handler
module.exports = app;
