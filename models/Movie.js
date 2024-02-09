import mongoose from 'mongoose';

const { Schema } = mongoose;

const movieSchema = new Schema({
  title: { 
    type: String, 
    required: true 
  },
  poster: String,
  director: String,
  year: { 
    type: Number, 
    required: true 
  },
  boxOffice: {
    type: String,
    default: 'N/A'
  },
  timesWatched: { 
    type: Number, 
    default: 0 
  },
    
  rating: {
    type: Number,
    required: true
  } 
});

const Movie = mongoose.model('Movie', movieSchema);

export default Movie;
