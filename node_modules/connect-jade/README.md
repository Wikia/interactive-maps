# connect-jade

Jade template render helper for connect

### Use case:

    $ npm install connect-jade

    // require lib
    var connectJade = require('connect-jade');
    var connect = require('connect');

    // initialize connect app
    var app = connect();
    app.use(connectJade({
              root: __dirname + "/views",
              debug: true,
              defaults: {
                title: "No title"
                keywords: "node, connect, jade, template"
              }
            })
    );

    // in routes
    var items = [1, 2, 3, 4];
    res.render('index', { title: 'Index Page', items: items });

#### Define "global" variables dynamicaly

    // require lib
    var connectJade = require('connect-jade');
    var connect = require('connect');

    // initialize connect app
    var app = connect();
    app.use(Connect.session({
              secret: Configuration.Session.secret,
              cookie: {
                maxAge: 60000
              }
            })
    );
    // it is stupid because I redefine user in each request
    // but better solution is longer
    // and not ass-simple
    // :) sorry
    app.use(function addUserFromSession(req, res, next) {
      if (typeof req.session.user != "undefined") {
        res.addVariable('user', req.session.user);
      } else {
        res.addVariable('user', {name: "Anonymous"});
      }
      next();
    });
    app.use(connectJade({
              root: __dirname + "/views",
              debug: true
            })
    );

#### Define functions for view

please check tests [line 60 - addSomeHelper]

### Tests

**Self:**

    git clone https://github.com/Folyam/connect-jade.git
    cd connect-jade
    npm test

**Travis:** https://travis-ci.org/#!/Yitsushi/connect-jade
