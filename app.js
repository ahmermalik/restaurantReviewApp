/**created by ahmer malik  11/8/2017 **/

//initialize the express app.
var express = require('express');
var app = express();
//initialize and require Node.js body parsing middleware
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));
//initialize database and link it.
var pgp = require('pg-promise')({});
var db = pgp({database: 'restaurant_db'});
var morgan = require('morgan');
var session = require('express-session');


app.use(session({
    secret: process.env.SECRET_KEY || 'dev',
    resave: true,
    saveUninitialized: false,
    cookie: {maxAge: 60000}
}));

app.use(morgan('dev'));

app.use(function (request, response, next) {
    if (request.session.user) {
        next();
    } else if (request.path == '/login') {
        next();
    } else {
        response.redirect('/login');
    }
});

//set public folder to be static
app.use('/static', express.static('public'));
//set view engine as 'handlebars'
app.set('view engine', 'hbs');




//router to display index.hbs as main page
app.get("/", function (request, response, next) {
    response.render('index.hbs');
});


app.get('/login', function (request, response) {
    response.render('landing.hbs');
});

app.get('/user/:id', function (request, response, next) {
    response.send('USER')
})

app.post('/login', function (request, response) {
    var username = request.body.username;
    var password = request.body.password;
    var query = 'SELECT * from reviewer WHERE email = $1';
    db.one(query, email)
        .then (function(results){
        console.log(results.password);
        console.log(password);
    }
    if (results.password == password){

        request.session.user = username;
        response.redirect('/');
    } else {
        response.render('login.hbs');
    }
});
// app.get('/user/:id', function (request, response, next) {
//     response.send('USER')
// })
//
//     var session = require('express-session');
//     app.use(session({
//         secret: process.env.SECRET_KEY || 'dev',
//         resave: true,
//         saveUninitialized: false,
//         cookie: {maxAge: 60000}
//     }));
//
// app.use(function (request, response, next) {
//     if (request.session.user) {
//         next();
//     } else if (request.path == '/login') {
//         next();
//     } else {
//         response.redirect('/login');
//     }
// });
//



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
    var id = request.params.id;
    // query to get name
    response.render('insert_review.hbs', {title: 'Add Reviews', id: id});
});

app.post('/addReview', function(request, response, next) {
    var title = request.body.title;
    var review = request.body.review_text;
    var stars = parseInt(request.body.stars);
    var id = request.body.id;
    var columns = {
        title: title,
        review: review,
        stars: stars,
        restaurant_id: id
    }

    console.log(columns);
    var query = 'INSERT INTO review \
    VALUES (default, ${title}, ${review}, ${stars}, Null, ${restaurant_id}) RETURNING id';
    db.any(query, columns)
        .then(function (results) {
            response.render('insert_review_complete.hbs', {});
            //console.log(q)
        })
        .catch(next);
})

app.get('/restaurant/:id', function (request, response, next) {
    var id = request.params.id;
    //doing a left inner join with the restaurant and review table, because some restaurants may not have reviews, but we still want to render the page correctly.
    var query = 'SELECT restaurant.id as id, restaurant.name, restaurant.address, restaurant.category,\n' +
        'review.stars, review.title, review.title, reviewer.reviewer_name,reviewer.email, reviewer.karma from restaurant\n' +
        'LEFT JOIN review ON restaurant.id = review.restaurant_id \n' +
        'LEFT JOIN reviewer ON reviewer.id = review.reviewer_id\n' +
        'WHERE restaurant.id = $1';

    db.any(query, id)
        .then(function(results){
            var restaurant = results[0]
         var context = {results : results, restaurant : restaurant}
         console.log(context);
         response.render('restaurant_details.hbs', context);

        })
        .catch(next);
});

app.post('/submit/:id', function (request, response, next) {
    var id = request.params.id;
    var query = "INSERT INTO review VALUES(default, null, $1, $2, $3, $4)"
    db.any(query, [request.body.inputStars, request.body.inputTitle, request.body.inputText, id])
        .then(function(result) {
            response.redirect(`/restaurant/${id}`);
        })
        .catch(next);
});


var PORT = process.env.PORT || 8000;

app.listen(PORT, function () {
    console.log('Listening on port ' + PORT);
});