import test from 'tape';
import $ from '../src';

const data = require('./data.json');

test('simple mirror transform', t => {
  const transform = $`{
    "bicycle": ${ $('store.bicycle')`` }
  }`;
  const expected = {
    bicycle: {
      color: 'red',
      price: 19.95
    }
  };
  t.plan(1);
  t.deepEquals(transform(data), expected, 'should be equal');
});

test('simple transform', t => {
  const transform = $('store')`{
    "bike": {
      "colour": ${ 'bicycle.color' },
      "price": "£${ 'bicycle.price' }"
    }
  }`
  const expected = {
    bike: {
      colour: 'red',
      price: "£19.95"
    }
  };
  t.plan(1);
  t.deepEquals(transform(data), expected, 'should be equal');
});

test('simple filter transform', t => {
  const transform = $`{
    "cheapBooks": ${ $('store.book[?(@.price < 9)]')`` } 
  }`;
  const expected = {
    cheapBooks: data.store.book.filter(x => x.price < 9)
  };
  t.plan(1);
  t.deepEquals(transform(data), expected, 'should be equal');
});

test('simple map transform', t => {
  const transform = $('store.book')`{
    "books": ${ $`{
      "whoWroteIt": ${ 'author' },
      "whatsItCalled": ${ 'title' }
    }` }
  }`;
  const expected = {
    books: data.store.book.map(({ author, title }) => ({
      whoWroteIt: author,
      whatsItCalled: title
    }))
  };
  t.plan(1);
  t.deepEquals(transform(data), expected, 'should be equal');
});

test('map transform with coercion', t => {
  const transform = $('store')`${ $('book')`{
    "author": ${ 'author' },
    "title": ${ 'title' },
    "price": ${ 'price<String>' },
    "missingValue": ${ 'alwaysNull' }
  }` }`;
  const expected = data.store.book.map(({ author, title, price }) => ({
    author,
    title,
    price: String(price),
    missingValue: null
  }));
  t.plan(1);
  t.deepEquals(transform(data), expected, 'should be equal');
});

test('root from within context', t => {
  const transform = $('store.bicycle')`{
    "bikeColor": ${ 'color' },
    "price": ${ 'price' },
    "authors": ${ $('$..author')`` }
  }`;
  const expected = {
    bikeColor: data.store.bicycle.color,
    price: data.store.bicycle.price,
    authors: data.store.book.map(({ author }) => author)
  };
  t.plan(1);
  t.deepEquals(transform(data), expected, 'should be equal');
});

test('handling an undefined mirror', t => {
  const transform = $`{
    "foo": ${ $('store.foo')`` }
  }`;
  const expected = {
    foo: null
  };
  t.plan(1);
  t.deepEquals(transform(data), expected, 'should be equal');
});

test('malformed error', t => {
  const transform = $`{
    foo: ${ 'store.foo' }
  }`;
  const expected = /Your transform is malformed/;
  t.plan(1);
  t.throws(() => transform(data), expected, 'should throw an error');
});
