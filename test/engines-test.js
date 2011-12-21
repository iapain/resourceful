var path = require('path')
  , assert = require('assert')
  , fs = require('fs')
  , vows = require('vows')
  , resourceful = require('../lib/resourceful');

var engines = fs.readdirSync(path.join(__dirname, 'engines')).map(function (e) { return require('./engines/' + e.slice(0,-3)); });

var resources = {};

engines.forEach(function (e) {
  resources[e] = {}
  vows.describe('resourceful/engines/' + e.name)
  .addBatch({
    'In database "test"': {
      topic: function () {
        e.load(resourceful, [
          { _id: 'bob', age: 35, hair: 'black', resource: 'Author'},
          { _id: 'tim', age: 16, hair: 'brown', resource: 'Author'},
          { _id: 'mat', age: 29, hair: 'black', resource: 'Author'},
          { _id: 'bob/1', title: 'Nodejs sucks!', year: 2003, fiction: true, resource: 'Book'},
          { _id: 'tim/1', title: 'Nodejitsu rocks!', year: 2008, fiction: false, resource: 'Book'},
          { _id: 'bob/2', title: 'Loling at you', year: 2011, fiction: true, resource: 'Book'},
          { _id: 'dummy/1', hair: 'black', resource: 'Dummy'},
          { _id: 'dummy/2', hair: 'blue', resource: 'Dummy'}
        ], this.callback);
      },
      'Defining resource "book"': {
        topic: function () {
          return resources[e].Book = resourceful.define('book', function () {
            this.use(e.name, e.options);

            this.string('title');
            this.number('year');
            this.bool('fiction');
          });
        },
        'will be successful': function (book) {
          assert.equal(Object.keys(book.properties).length, 4);
        }
      },
      'Defining resource "author"': {
        topic: function () {
          return resources[e].Author = resourceful.define('author', function () {
            this.use(e.name, e.options);

            this.number('age');
            this.string('hair').sanitize('lower');
          });
        },
        'will be successful': function (author) {
          assert.equal(Object.keys(author.properties).length, 3);
        }
      }
    }
  }).addBatch({
    'In database "test"': {
      topic: function () {
        return null;
      },
      "an Resource.all() request": {
        topic: function () {
          resources[e].Author.all(this.callback);
        },
        "should respond with an array of all records": function (err, obj) {
          assert.isNull(err);
          assert.isArray(obj);
          assert.equal(obj.length, 3);
        }
      }
    }
  }).addBatch({
    'In database "test"': {
      topic: function () {
        return null;
      },
      "a Resource.get() request": {
        "when successful": {
          topic: function () {
            resources[e].Author.get("bob", this.callback);
          },
          "should respond with a Resource instance": function (err, obj) {
            assert.isNull(err);
            assert.isObject(obj);
            assert.instanceOf(obj, resourceful.Resource);
            assert.equal(obj.constructor, resources[e].Author);
          },
          "should respond with the right object": function (err, obj) {
            assert.isNull(err);
            assert.equal(obj._id, 'bob');
            assert.equal(obj.age, 35);
            assert.equal(obj.hair, 'black');
            assert.equal(obj.resource, 'Author');
          }
        },
        "when unsuccessful": {
          topic: function () {
            resources[e].Author.get("david", this.callback);
          },
          "should respond with an error": function (err, obj) {
            assert.equal(err.status, 404);
            assert.isUndefined(obj);
          }
        }
      }
    }
  }).addBatch({
    'In database "test"': {
      topic: function () {
        return null;
      },
      "a Resource.create() request": {
        topic: function () {
          resources[e].Author.create({ _id: 'han', age: 30, hair: 'red'}, this.callback);
        },
        "should return the newly created object": function (err, obj) {
          assert.isNull(err);
          assert.strictEqual(obj.constructor, resources[e].Author);
          assert.instanceOf(obj, resources[e].Author);
          assert.equal(obj._id, 'han');
          assert.equal(obj.age, 30);
          assert.equal(obj.hair, 'red');
          assert.equal(obj.resource, 'Author');
        },
        "should create the record in the db": {
          topic: function () {
            resources[e].Author.get('han', this.callback);
          },
          "should respond with a Resource instance": function (err, obj) {
            assert.isNull(err);
            assert.isObject(obj);
            assert.instanceOf(obj, resourceful.Resource);
            assert.equal(obj.constructor, resources[e].Author);
          },
          "should respond with the right object": function (err, obj) {
            assert.isNull(err);
            assert.equal(obj._id, 'han');
            assert.equal(obj.age, 30);
            assert.equal(obj.hair, 'red');
            assert.equal(obj.resource, 'Author');
          },
          "and a Resource.destroy() request": {
            topic: function () {
              resources[e].Author.destroy('han', this.callback);
            },
            "should be successful": function (err, obj) {
              assert.isNull(err);
            }
          }
        }
      }
    }
  }).addBatch({
    'In database "test"': {
      topic: function () {
        return null;
      },
      "a Resource.find() request": {
        "when successful": {
          topic: function () {
            resources[e].Author.find({ hair: "black" }, this.callback);
          },
          "should respond with an array of length 2": function (err, obj) {
            assert.isNull(err);
            assert.equal(obj.length, 2);
          },
          "should respond with an array of Resource instances": function (err, obj) {
            assert.isNull(err);
            assert.isArray(obj);
            assert.instanceOf(obj[0], resourceful.Resource);
            assert.instanceOf(obj[1], resourceful.Resource);
            assert.equal(obj[0]._id, 'bob');
            assert.equal(obj[0].age, 35);
            assert.equal(obj[0].hair, 'black');
            assert.equal(obj[0].resource, 'Author');
          }
        },
        "when unsuccessful": {
          topic: function () {
            resources[e].Author.find({ hair: "blue" }, this.callback);
          },
          "should respond with an empty array": function (err, obj) {
            assert.isNull(err);
            assert.isArray(obj);
            assert.equal(obj.length, 0);
          }
        }
      }
    }
  }).addBatch({
    'In database "test"': {
      topic: function () {
        resources[e].Author.get('bob', this.callback);
      },
      "it should have 'bob' object": function (err, obj) {
        assert.isNull(err);
        assert.equal(obj._id, 'bob');
        assert.equal(obj.age, 35);
        assert.equal(obj.hair, 'black');
        assert.equal(obj.resource, 'Author');
      },
      "a Resource.update() request when successful": {
        topic: function () {
          resources[e].Author.update('bob', { age: 31 }, this.callback);
        },
        "should respond with a Resource instance": function (err, obj) {
          assert.isNull(err);
          assert.isObject(obj);
          assert.instanceOf(obj, resourceful.Resource);
          assert.equal(obj.constructor, resources[e].Author);
        },
        "should respond with the right object": function (err, obj) {
          assert.isNull(err);
          assert.equal(obj._id, 'bob');
          assert.equal(obj.age, 31);
          assert.equal(obj.hair, 'black');
          assert.equal(obj.resource, 'Author');
        },
        "should update the object in db": {
          topic: function () {
            resources[e].Author.get('bob', this.callback);
          },
          "should respond with a Resource instance": function (err, obj) {
            assert.isNull(err);
            assert.isObject(obj);
            assert.instanceOf(obj, resourceful.Resource);
            assert.equal(obj.constructor, resources[e].Author);
          },
          "should respond with the right object": function (err, obj) {
            assert.isNull(err);
            assert.equal(obj._id, 'bob');
            assert.equal(obj.age, 31);
            assert.equal(obj.hair, 'black');
            assert.equal(obj.resource, 'Author');
          }
        }
      }
    }
  }).addBatch({
    'In database "test"': {
      topic: function () {
        resources[e].Author.get('bob', this.callback);
      },
      "it should have 'bob' object": function (err, obj) {
        assert.isNull(err);
        assert.equal(obj._id, 'bob');
        assert.equal(obj.age, 31);
        assert.equal(obj.hair, 'black');
        assert.equal(obj.resource, 'Author');
      },
      "a Resource.save() request when successful": {
        topic: function (obj) {
          obj.age = 35;
          resources[e].Author.save(obj, this.callback);
        },
        "should respond with a Resource instance": function (err, obj) {
          assert.isNull(err);
          assert.isObject(obj);
          assert.instanceOf(obj, resourceful.Resource);
          assert.equal(obj.constructor, resources[e].Author);
        },
        "should respond with the right object": function (err, obj) {
          assert.isNull(err);
          assert.equal(obj._id, 'bob');
          assert.equal(obj.age, 35);
          assert.equal(obj.hair, 'black');
          assert.equal(obj.resource, 'Author');
        },
        "should update the object in db": {
          topic: function () {
            resources[e].Author.get('bob', this.callback);
          },
          "should respond with a Resource instance": function (err, obj) {
            assert.isNull(err);
            assert.isObject(obj);
            assert.instanceOf(obj, resourceful.Resource);
            assert.equal(obj.constructor, resources[e].Author);
          },
          "should respond with the right object": function (err, obj) {
            assert.isNull(err);
            assert.equal(obj._id, 'bob');
            assert.equal(obj.age, 35);
            assert.equal(obj.hair, 'black');
            assert.equal(obj.resource, 'Author');
          }
        }
      }
    }
  }).addBatch({
    "Creating object without 'id'": {
      topic: function () {
        resources[e].Author.create({ age: 51, hair: 'white' }, this.callback);
      },
      "should be successful": function (err, obj) {
        assert.isNull(err);
        assert.notEqual(obj._id, undefined);
        assert.equal(obj.age, 51);
        assert.equal(obj.hair, 'white');
        assert.equal(obj.resource, 'Author');
      }
    }
  }).export(module)
});