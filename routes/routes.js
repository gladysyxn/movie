// Importing necessary modules
import express from 'express';
import * as mainController from '../controllers/mainController.js';

// Create a router object
const router = express.Router();


// Home page route
router.get('/', mainController.showMovies);
router.post('/search', mainController.searchMovies);
router.post('/save', mainController.saveMovie);
router.get('/watch/:id', mainController.watchMovie);
router.get('/delete/:id', mainController.deleteMovie);
router.get('/sort/:type', mainController.sortMovies);
router.get('/info/:id', mainController.info);
router.get('/filter', mainController.filterMovies);

// Export the router
export default router;
