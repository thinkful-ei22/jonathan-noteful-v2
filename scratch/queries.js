'use strict';

const knex = require('../knex');

let searchTerm;
knex
  .select('notes.id', 'title', 'content')
  .from('notes')
  .modify(queryBuilder => {
    if (searchTerm) {
      queryBuilder.where('title', 'like', `%${searchTerm}%`);
    }
  })
  .orderBy('notes.id')
  .then(results => {
    console.log(JSON.stringify(results, null, 2));
  })
  .catch(err => {
    console.error(err);
  });

knex
  .select('id', 'title', 'content')
  .from('notes')
  .where('id', 1000)
  
  .then(([results]) => {
    if (results) {
      console.log(JSON.stringify(results, null, 2));
    }else{
      console.log('Not Found');
    }
  })
  .catch(err => {
    console.error(err);
  });  

let updateInfo = {title: 'test', content:'stuff'};
knex
  .update(updateInfo)
  .from('notes')
  .where('id', 1002)
  .returning(['id', 'title', 'content'])
  
  .then(([results]) => {
    if (results) {
      console.log(JSON.stringify(results, null, 2));
    }else{
      console.log('Not Found');
    }
  })
  .catch(err => {
    console.error(err);
  });  

let newInfo = {title: 'NEW', content: 'STUFF'};
knex
  .insert(newInfo)
  .from('notes')
  .returning(['id', 'title', 'content'])
  
  .then(([results]) => {
    if (results) {
      console.log(JSON.stringify(results, null, 2));
    }else{
      console.log('Not Found');
    }
  })
  .catch(err => {
    console.error(err);
  });  

knex
  .where('id', 1003)
  .from('notes')
  .del()
  .then(() => {
    console.log('Deleted');
  })
  .catch(err => {
    console.error(err);
  });  