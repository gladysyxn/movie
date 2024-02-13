import Movie from '../models/Movie.js';
let savedMovies, totalMovies, totalTimesWatched, sortCriteria, sortType, genreFilter, filter, allGenreTypes;

export const showMovies = async (req, res) => {
  await aggregateMoviesData();
  savedMovies = await Movie.find(filter).sort(sortCriteria);
  allGenreTypes = await Movie.distinct('genre').sort();
  res.render('index', { savedMovies, totalMovies, totalTimesWatched, sortType, allGenreTypes, genreFilter});
}

export const searchMovies = async (req, res) => {
  const movieTitle = req.body.movieTitle;
  try {
    if (movieTitle === "" ){
        req.flash('warning', "Please enter a keyword." );
        res.redirect('/');
    }
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
   let {imdbID, title, year, tmdbID} = req.body;

  try {
     
     
      // Check if the movie already exists in the database
    let movie = await Movie.findOne({ title: title, year: year });

    if (movie) {
      // If movie exists, increment the timesWatched
      movie.timesWatched += 1;
      await movie.save();
    } else {
       
        if (tmdbID){
            imdbID = await convertTMDBIDtoOMDBID(tmdbID);
           
        }
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
        rating: omdbMovie.imdbRating,
        plot: omdbMovie.Plot,
        actors: omdbMovie.Actors,
        genre: omdbMovie.Genre.split(', '),
        runTime: omdbMovie.RunTime,
      });
       
    const summary = movie.title + " is watched";  
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
      const summary = movie.title + " is watched";
      req.flash('info', summary);
     
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
    sortType = req.params.type;
      if (sortType === 'title') {
    sortCriteria = { title: 1 };
  }
  else if (sortType === 'year') {
    sortCriteria = { year: -1 };
  }
else if (sortType === 'rating') {
    sortCriteria = { rating: -1 };
  }
else if (sortType === 'timesWatched') {
    sortCriteria = { timesWatched: -1 };
  }

     
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
      
    totalMovies = 0;
      totalTimesWatched = 0;
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
    const movieId = req.params.id;
    const movie = await Movie.findById(movieId);
     
    let movieTitle = encodeURI(movie.title, movie.Title);  
    let recs = [];
   
    const response = await fetch(`https://api.themoviedb.org/3/search/movie?query=${movieTitle}&include_adult=false&language=en-US&page=1&api_key=${process.env.TMDB_MOVIE_KEY}`);
    const searchResult = await response.json();
      
    
    if (searchResult.total_results > 0) {
      let tmdb_id = "";
      searchResult.results.forEach( result => {
          if (result.release_date && result.release_date.slice(0, 4) === `${movie.year}`)
            tmdb_id = result.id;
      });

      const recResponse = await fetch(`https://api.themoviedb.org/3/movie/${tmdb_id}/recommendations?language=en-US&page=1&api_key=${process.env.TMDB_MOVIE_KEY}`);
     
      const recResult = await recResponse.json();

      recs = recResult.results.slice(0, 10);
    }
     
    res.render('info', {movie, recs});
  } catch (error) {
    console.error(error);
    res.status(500).send('Error processing request');
   
  }
};


   
export const filterMovies = async (req, res) => {
  try {
   
    genreFilter= req.query.genre;
   
    if (genreFilter != ""){
        filter = {'genre': new RegExp( genreFilter, "i") };
    }
    else {
        filter={};
    }
     
res.redirect('/');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error processing request');
  }
};


const convertTMDBIDtoOMDBID = async (tmdbID) => {
    const response = await fetch(`https://api.themoviedb.org/3/movie/${tmdbID}/external_ids?api_key=${process.env.TMDB_MOVIE_KEY}`);
    const result = await response.json();
    return result.imdb_id;
}
