/**created by ahmer malik  11/8/2017 **/

//initialize the express app.
var express = require('express');
var app = express();
//initialize and require Node.js body parsing middleware
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: false }));
//initialize database and link it.
var pgp = require('pg-promise')({});
var db = pgp({database: 'restaurant_db'});
//set public folder to be static
app.use('/static', express.static('public'));
//set view engine as 'handlebars'
app.set('view engine', 'hbs');

//router to display index.hbs as main page
app.get("/", function (request, response) {
    response.render('index.hbs');
});



app.get('/search', function (request, response, next) {
    //set 'search' query to the 'userSearch' name form in index.hbs
    let search = request.query.userSearch;
    //set 'query' to select ALL from restaurant table where restaurant name is ___. # is important. it tells the program not to use ' ' around $1, since we're already doing it.
    let query = `SELECT * FROM restaurant WHERE restaurant.name ILIKE '%$1#%'`;

    db.any(query, search)
        .then(function(searchResults) {
            //set context for how you want data to be displayed.
            var context = {searchResults: searchResults};
            //
            response.render('result.hbs', context);

        })
        .catch(next);
});

app.get('/review/:id', function (request, response, next) {

    response.render('insert_review.hbs');
});

app.get('/restaurant/:id', function (request, response, next) {
    var id = request.params.id;
    var q = 'SELECT * from review \
    JOIN restaurant ON restaurant.id = restaurant_id \
    JOIN reviewer ON reviewer.id = reviewer_id \
    WHERE restaurant_id = $1';

    db.any(q, id)
        .then(function(results){
            var restaurant = results[0]
         var context = {results : results, restaurant : restaurant}
         console.log(context);
         response.render('restaurant_details.hbs', context);

        })
        .catch(next);
});

app.listen(8000, function () {
    console.log('Listening on port 8000');
});

