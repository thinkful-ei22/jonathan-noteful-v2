'use strict';

const express = require('express');
const knex = require('../knex');
const router = express.Router();

router.get('/', (req, res, next) => {
 
  knex.select('id', 'name')
    .from('tags')
    .then(results => {
      res.json(results);
    })
    .catch(err => next(err));
});

// GET a single item by id

router.get('/:id', (req, res, next) => {

  const id = req.params.id;
  knex
    .select('id', 'name')
    .from('tags')
    .where('id', id)
    .then(item => {
      if(item) {
        res.json(item);
      } else {
        next();
      }
    });
});

// PUT update an item
router.put('/:id', (req, res, next) => {
  const id = req.params.id;

  /* NEVER TRUST USERS - VALIDATE INPUT */
  const updateObj = {};
  const updateableFields = ['name'];

  updateableFields.forEach(field => {
    if (field in req.body) {
      updateObj[field] = req.body[field];
    }
  });
  /* NEVER TRUST USERS - VALIDATE INPUT */
  if (!updateObj.name) {
    const err = new Error ('Missing `name` in request body');
    err.status = 400;
    return next(err);
  }
  knex('tags')
    .update(updateObj)
    .where('id', id)
    .returning(['id', 'name'])
    .then(([result]) => {
      if (result) {
        res.json(result);
      } else {
        next();
      }
    })
    .catch(err => {
      next(err); 
    });
});

router.post('/', (req, res, next) => {
  const { name } = req.body;

  /***** Never trust users. Validate input *****/
  if (!name) {
    const err = new Error('Missing `name` in request body');
    err.status = 400;
    return next(err);
  }

  const newItem = { name };

  knex.insert(newItem)
    .into('tags')
    .returning(['id', 'name'])
    .then((results) => {
      // Uses Array index solution to get first item in results array
      const result = results[0];
      res.location(`${req.originalUrl}/${result.id}`).status(201).json(result);
    })
    .catch(err => next(err));
});

router.delete('/:id', (req, res, next) => {
  knex.del()
    .where('id', req.params.id)
    .from('tags')
    .then(() => {
      res.status(204).end();
    })
    .catch(err => {
      next(err);
    });
});

module.exports = router;