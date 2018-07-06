'use strict';

const express = require('express');
const knex = require('../knex');
const router = express.Router();

// GET all folders
router.get('/', (req, res, next) => {
  console.log('--------------///////////');
  knex.select('id', 'name')
    .from('folders')
    .then(results => {
      res.json(results);
    })
    .catch(err => next(err));
});

// GET a single item by id

router.get('/:id', (req, res, next) => {
  console.log('--------------///////////');
  const id = req.params.id;
  knex('folders')
    .first()
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
  knex('folders')
    .where('id', id)
    .update(updateObj)
    .then(item => {
      if (item) {
        res.json(item);
      } else {
        next();
      }
    })
    .catch(err => {
      next(err); 
    });
});

router.post('/', (req, res, next) => {
  const {name} = req.body;
  const newFolder = {name};

  if (!newFolder) {
    const err = new Error ('Missing `name` in request body.');
    err.status = 400;
    return next(err);
  }
  knex 
    .insert(newFolder)
    .returning(['id', 'name'])
    .then(([results]) => {
      if (results) {
        res.location(`http://${req.headers.host}/folders/${results.id}`).status(201).json(results);
      } else {
        next();
      }
    })
    .catch(err => next(err));
});

router.delete('/:id', (req, res, next) => {
  const id = req.params.id;

  knex
    .where('folders.id', id)
    .from('folders')
    .del()
    .then(() => {
      res.sendStatus(204);
    })
    .catch(err => next(err));
});

module.exports = router;