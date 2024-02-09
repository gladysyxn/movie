import Movie from '../models/Movie.js';
let savedMovies, totalMovies, totalTimesWatched, sortCriteria;

export const showMovies = async (req, res) => {
  await aggregateMoviesData();
  savedMovies = await Movie.find().sort(sortCriteria);
  res.render('index', { savedMovies, totalMovies, totalTimesWatched });
}

export const searchMovies = async (req, res) => {
  const movieTitle = req.body.movieTitle;
  try {
    const response = await fetch(`http://www.omdbapi.com/?s=${movieTitle}&apikey=${process.env.MOVIE_KEY}`);
    const movies = await response.json();
    console.log(movies);
      
    res.render('results', {movies: movies.Search});
  } catch (error) {
    res.status(500).send('Error fetching data');
  }
};

export const saveMovie = async (req, res) => {
  //const { title, poster, director, year, boxOffice } = req.body;
    const {imdbID, title, year} = req.body;

  try {
      
      
      // Check if the movie already exists in the database
    let movie = await Movie.findOne({ title: title });

    if (movie) {
      // If movie exists, increment the timesWatched
      movie.timesWatched += 1;
      await movie.save();
    } else {
          const response = await fetch(`http://www.omdbapi.com/?i=${imdbID}&apikey=${process.env.MOVIE_KEY}`);
      const omdbMovie = await response.json();
        console.log(omdbMovie);
        
      // If movie doesn't exist, create a new one
      movie = new Movie({
        title: omdbMovie.Title,
        poster: omdbMovie.Poster,
        director: omdbMovie.Director,
        year: Number(omdbMovie.Year.substring(0,4)),
        boxOffice: omdbMovie.BoxOffice,
        timesWatched: 1,
        rating: omdbMovie.imdbRating
      });
        
    const summary = title + " is watched";
        
      await movie.save();
        // Add flash message
        req.flash('info', summary);
    }
    res.redirect('/');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error processing request');
  }
};

export const watchMovie = async (req, res) => {
  const movieId = req.params.id;

  try {
    const movie = await Movie.findById(movieId);
    if (movie) {
      movie.timesWatched += 1;
      await movie.save();
    }
    res.redirect('/');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error processing request');
  }
};

export const deleteMovie = async (req, res) => {
  const movieId = req.params.id;

  try {
    const result = await Movie.findByIdAndDelete(movieId);
    console.log(result);
    res.redirect('/');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error processing request');
  }
};

export const sortMovies = async (req, res) => {
  try {
    sortCriteria = { title: 1 };
    res.redirect('/');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error processing request');
  }
};

export const sortRating = async (req, res) => {
  try {
    sortCriteria = { rating: 1 };
    res.redirect('/');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error processing request');
  }
};

const aggregateMoviesData = async () => {
  try {
    const result = await Movie.aggregate([
      {
        $group: {
          _id: null, // Grouping without a specific field to aggregate all documents
          totalMovies: { $sum: 1 }, // Counting the total number of movies
          totalTimesWatched: { $sum: "$timesWatched" } // Summing up all timesWatched values
        }
      }
    ]);

    if (result.length > 0) {
      // Extracting the result from the first element of the result array
      totalMovies = result[0].totalMovies;
      totalTimesWatched = result[0].totalTimesWatched;
      console.log(`Total Movies: ${totalMovies}, Total Times Watched: ${totalTimesWatched}`);
    } else {
      console.log("No data found.");
    }
  } catch (error) {
    console.error("Error aggregating movie data:", error);
  }
};

export const info = async (req, res) => {
  try {
    sortCriteria = { rating: 1 };
    res.redirect('/');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error processing request');
  }
};

//const info = async (req, res) => {
//  try {
//    // Extract IMDb ID from the request body
//    const { imdbID } = req.body;
//
//    // Fetch movie info from OMDB API
//    const response = await fetch(`http://www.omdbapi.com/?i=${imdbID}&apikey=${process.env.MOVIE_KEY}`);
//    const omdbMovie = await response.json();
//
//    // Extract relevant movie information
//
//     
//const { Title, Year, Plot, Director, Genre, Released } = omdbMovie;
//    // Send the extracted movie information as a response
//    res.json({
//      title: movie.Title,
//      year: movie.Year,
//      plot: movie.Plot,
//      director: movie.Director,
//      genre: movie.Genre,
//      released: movie.Released
//    });
//  } catch (error) {
//    // Handle errors
//    console.error('Error fetching movie info:', error);
//    res.status(500).json({ error: 'Internal server error' });
//  }
//};