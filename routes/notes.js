
'use strict';

const express = require('express');

// Create an router instance (aka "mini-app")
const router = express.Router();

// TEMP: Simple In-Memory Database
// const data = require('../db/notes');
// const simDB = require('../db/simDB');
// const notes = simDB.initialize(data);

const knex = require('../knex');

// Get All (and search by query) ------------OLD VERSION
// router.get('/', (req, res, next) => {
//   const { searchTerm } = req.query;
//
//   notes.filter(searchTerm)
//     .then(list => {
//       res.json(list);
//     })
//     .catch(err => {
//       next(err);
//     });
// });

router.get('/', (req, res, next) => {
  const { searchTerm, folderId } = req.query;

  knex
    .select('notes.id' , 'title', 'content', 'folders.id as folderId',
      'folders.name as folderName', 'notes.created')
    .from('notes')
    .leftJoin('folders', 'notes.folder_id', 'folders.id')

    .modify(queryBuilder => {
      if (searchTerm) {
        queryBuilder.where('title', 'like', `%${searchTerm}%`);
      }
    })

    .modify(queryBuilder => {
      if (folderId) {
        queryBuilder.where('folder_id', folderId);
      }
    })

    .orderBy('notes.id')
    .then(results => {
      if(results) {
        res.json(results);
      } else {
        next();
      }
    })
    .catch(err => next(err));
});

// Get a single item
router.get('/:id', (req, res, next) => {
  const id = req.params.id;

  knex
    .select('notes.id' , 'title', 'content', 'folders.id as folderId',
      'folders.name as folderName', 'notes.created')
    .from('notes')
    .leftJoin('folders', 'notes.folder_id', 'folders.id')
    .where('notes.id', id)
    
    .then(results => {
      if(results) {
        res.json(results);
      } else {
        next();
      }
    })
    .catch(err => next(err));
});

// Put update an item-------------------------------OLD VERSION
// router.put('/:id', (req, res, next) => {
//   const id = req.params.id;
//
//   /***** Never trust users - validate input *****/
//   const updateObj = {};
//   const updateableFields = ['title', 'content'];
//
//   updateableFields.forEach(field => {
//     if (field in req.body) {
//       updateObj[field] = req.body[field];
//     }
//   });
//
//   /***** Never trust users - validate input *****/
//   if (!updateObj.title) {
//     const err = new Error('Missing `title` in request body');
//     err.status = 400;
//     return next(err);
//   }
//
//   notes.update(id, updateObj)
//     .then(item => {
//       if (item) {
//         res.json(item);
//       } else {
//         next();
//       }
//     })
//     .catch(err => {
//       next(err);
//     });
// });

// Put update an item
router.put('/:id', (req, res, next) => {
  const id = req.params.id;

  /***** Never trust users - validate input *****/
  const updateObj = {};
  const updateableFields = ['title', 'content'];

  updateableFields.forEach(field => {
    if (field in req.body) {
      updateObj[field] = req.body[field];
    }
  });

  /***** Never trust users - validate input *****/
  if (!updateObj.title) {
    const err = new Error('Missing `title` in request body');
    err.status = 400;
    return next(err);
  }
  
  knex
    .update(updateObj)
    .from('notes')
    .where('notes.id', id)
    .then(()=> {
      return knex
        .select('notes.id', 'title', 'content', 'folders.id as folder_id', 
          'folders.name as folderName')
        .from('notes')
        .leftJoin('folders', 'notes.folder_id', 'folders.id')
        .where('notes.id', id);
    })
    .then((results) => {
      if (results) {
        res.json(results);
      }else{
        next();
      }
    })
    .catch(err => next(err));
});  

// Post (insert) an item
router.post('/', (req, res, next) => {
  const { title, content, folder_id } = req.body;
  const newItem = {title, content, folder_id};

 

  /***** Never trust users - validate input *****/
  if (!newItem.title) {
    const err = new Error('Missing `title` in request body');
    err.status = 400;
    return next(err);
  }

  let noteId;

  knex
    .insert(newItem)
    .into('notes')
    .returning('id')
    .then(([id]) => {
      noteId = id;
      return knex
        .select('notes.id', 'title', 'content', 'folder_id as folderId', 'folders.name as folderName')
        .from('notes')
        .leftJoin('folders', 'notes.folder_id', 'folders.id')
        .where('notes.id', noteId);
    })
    .then(([result]) => {
      res.location(`${req.originalUrl}/${result.id}`).status(201).json(result);
    })
    .catch(err => next(err));
});


// Delete an item------------------------------------------OLD VERSION
// router.delete('/:id', (req, res, next) => {
//   const id = req.params.id;
//
//   notes.delete(id)
//     .then(() => {
//       res.sendStatus(204);
//     })
//     .catch(err => {
//       next(err);
//     });
// });
//

router.delete('/:id', (req, res, next) => {
  const id = req.params.id;

  knex('notes')
    .where('id', `${id}`)
    .del()
    .then(note => {
      res.json(note).status(204).send('DELETED NOTE');
    })
    .catch((err => {
      console.error(err);
    }));
});

module.exports = router;