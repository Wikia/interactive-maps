var Connect       = require('connect'),
    connectJade   = require('../index'),
    Request       = require('./support/http').Request,
    should        = require('should'),
    UrlRouter     = require('urlrouter');

var router = UrlRouter(function Application(app) {
  var data = {
    data: {
      _id: "28a4e331b5e1dbe2f5264304b9bd8cb7",
      name: "test content"
    }
  };
  app.get("/",  function root(req, res) {
    res.end("root");
  });

  app.get("/extends-with-title", function extendsWithTitle(req, res) {
    data.title = "Got title";
    res.render("test/extends_with_title", data);
  });

  app.get("/extends-without-title", function extendsWithoutTitle(req, res) {
    if (typeof data.title != "undefined") {
      delete data.title;
    }
    res.render("test/extends_without_title", data);
  });

  app.get("/raw", function raw(req, res) {
    res.render("test/raw", data);
  });

  app.get("/raw-with-dynamic-defaults", function rawWithDynamicDefaults(req, res) {
    var user = {
      name: "username",
      email: "user@email.addr"
    };
    res.addVariable('user', user);
    res.render("test/raw_with_dynamic_defaults", data);
  });

  app.get("/raw-with-dynamic-defaults-get", function rawWithDynamicDefaultsGet(req, res) {
    res.render("test/raw_with_dynamic_defaults", data);
  });

  app.get("/raw-with-helper", function rawWithDynamicHelper(req, res) {
    res.render("test/raw_with_helper", data);
  });
});

var app = Connect();
app.use(connectJade({
  root: __dirname + "/views",
  debug: true,
  defaults: {
    title: "No title"
  }
}));
app.use(function addSomeHelper(req, res, next) {
  if (!res.hasFunction('mailto')) {
    res.addFunction('mailto', function mailto(user) {
      return "<a href='mailto:" + user.email + "'>" + user.name + "</a>";
    });
  }

  if (!res.hasFunction('antispam')) {
    res.addFunction('antispam', function antispam(email) {
      return email.replace(/@/, " {4t} ").replace(/\./, ' _b0t_ ');
    });
  }

  next();
})
app.use(router);

function testServer (name, fn) {
  test(name, function (done) {
    var request = new Request(app);
    fn(request);
    request.end(done);
  });
}

suite("connect-jade", function() {
  test("use connect with / path", function(done) {
    var request = new Request(app);
    request.get('/', function (res) {
      res.body.should.match(/root/);
    });
    request.end(done);
  });

  test("should render jade with extends and title from parameters", function(done) {
    var request = new Request(app);
    request.get('/extends-with-title', function (res) {
      res.body.should.match(/meta description/);
      res.body.should.match(/block keywords/);
      res.body.should.match(/<h1>28a4e331b5e1dbe2f5264304b9bd8cb7<\/h1>/);
      res.body.should.match(/<p>test content<\/p>/);
    });
    request.end(done);
  });

  test("should render jade with extends and default title", function(done) {
    var request = new Request(app);
    request.get('/extends-without-title', function (res) {
      res.body.should.match(/meta description/);
      res.body.should.match(/block keywords/);
      res.body.should.match(/<title>No title<\/title>/);
      res.body.should.match(/<h1>28a4e331b5e1dbe2f5264304b9bd8cb7<\/h1>/);
      res.body.should.match(/<p>test content<\/p>/);
    });
    request.end(done);
  });

  test("should render jade", function(done) {
    var request = new Request(app);
    request.get('/raw', function (res) {
      res.body.should.match(/<h1>28a4e331b5e1dbe2f5264304b9bd8cb7<\/h1>/);
      res.body.should.match(/<p>test content<\/p>/);
    });
    request.end(done);
  });

  test("should render jade with dynamic defaults (part 1)", function(done) {
    var request = new Request(app);
    request.get('/raw-with-dynamic-defaults', function (res) {
      res.body.should.match(/<h1>28a4e331b5e1dbe2f5264304b9bd8cb7<\/h1>/);
      res.body.should.match(/<p>test content<\/p>/);
      res.body.should.match(/<p>username:user@email.addr<\/p>/);
    });
    request.end(done);
  });

  test("should render jade with dynamic defaults (part 2)", function(done) {
    var request = new Request(app);
    request.get('/raw-with-dynamic-defaults-get', function (res) {
      res.body.should.match(/<h1>28a4e331b5e1dbe2f5264304b9bd8cb7<\/h1>/);
      res.body.should.match(/<p>test content<\/p>/);
      res.body.should.match(/<p>username:user@email.addr<\/p>/);
    });
    request.end(done);
  });

  test("should render jade with helper", function(done) {
    var request = new Request(app);
    request.get('/raw-with-helper', function (res) {
      res.body.should.match(/<h1>28a4e331b5e1dbe2f5264304b9bd8cb7<\/h1>/);
      res.body.should.match(/<p>test content<\/p>/);
      res.body.should.match(/<p><a href='mailto:user@email.addr'>username<\/a><\/p>/);
      res.body.should.match(/<p>username => user {4t} email _b0t_ addr<\/p>/);
    });
    request.end(done);
  });
});
