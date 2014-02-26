var HyperJson = require("hyperjson");
var _ = require("underscore");

var HyperJsonCollection = function(obj, key) {
  var index, newObj;
  obj = _.clone(obj);
  if (Array.isArray(obj)) {
    if (!!key) {
      newObj = {};
      index = 0;
      _.each(obj, function(item) {
        newObj[item[key]] = item;
      });
      obj = newObj;
    }
  }
  this.obj = {
    _items: obj
  };
};

HyperJsonCollection.prototype = Object.create(HyperJson.prototype);

HyperJsonCollection.prototype.each = function(cb) {
  var i, items, len, x;
  items = this.obj._items;
  if (Array.isArray(items)) {
    len = (!!items ? items.length : 0);
    i = 0;
    while (i < len) {
      items[i] = cb(items[i]);
      i++;
    }
  } else {
    for (x in items) {
      items[x] = cb(_.clone(items[x]), x);
    }
  }
  return this;
};

HyperJsonCollection.prototype.linkEach = function(rel, cb) {
  var i, items, len, x;
  items = this.obj._items;
  if (Array.isArray(items)) {
    len = (!!items ? items.length : 0);
    i = 0;
    while (i < len) {
      items[i] = new HyperJson(_.clone(items[i])).link(rel, cb(items[i], i)).toObject();
      i++;
    }
  } else {
    for (x in items) {
      items[x] = new HyperJson(_.clone(items[x])).link(rel, cb(items[x], x)).toObject();
    }
  }
  return this;
};


module.exports = HyperJsonCollection;
