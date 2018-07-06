
'use strict';

const express = require('express');

// Create an router instance (aka "mini-app")
const router = express.Router();
const knex = require('../knex');
const hydrateNotes = require('../utils/hydrateNotes');


router.get('/', (req, res, next) => {
  const { searchTerm, folderId, tagId } = req.query;

  knex
    .select('notes.id' , 'title', 'content', 'folders.id as folderId',
      'folders.name as folderName', 'notes.created')
    .from('notes')
    .leftJoin('folders', 'notes.folder_id', 'folders.id')
    .leftJoin('notes_tags', 'notes.id', 'notes_tags.note_id')
    .leftJoin('tags','tags.id','notes_tags.tag_id')

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

    .modify(queryBuilder => {
      if (tagId) {
        queryBuilder.where('tag_id', tagId);
      }
    })

    .orderBy('notes.id')
    .then(result => {
      if (result) {
        const hydrated = hydrateNotes(result);
        res.json(hydrated);
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
    .leftJoin('notes_tags', 'notes.id', 'notes_tags.note_id')
    .leftJoin('tags','tags.id','notes_tags.tag_id')
    .where('notes.id', id)
    
    .then(results => {
      if(results) {
        const hydrated = hydrateNotes(results);
        res.json(hydrated);
      } else {
        next();
      }
    })
    .catch(err => next(err));
});


// Put update an item
router.put('/:id', (req, res, next) => {
  const id = req.params.id;
  const tags = req.body.tags;

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
        .from('notes_tags')
        .where('note_id', id)
        .del();
    })
    .then(() => { 
      const tagsInsert = tags.map(tagId => ({note_id: id, tag_id: tagId}));
      return knex
        .inser(tagsInsert)
        .into('notes_tags');
    })
    .then(() => {
      return knex
        .select('notes.id', 'title', 'content', 'folders.id as folder_id', 
          'folders.name as folderName')
        .from('notes')
        .leftJoin('folders', 'notes.folder_id', 'folders.id')
        .leftJoin('notes_tags', 'notes.id', 'notes_tags.note_id')
        .leftJoin('tags','tags.id','notes_tags.tag_id')
        .where('notes.id', id);
    })
    .then((results) => {
      if (results) {
        const hydrated = hydrateNotes(results);
        res.json(hydrated);
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
  const tags = req.body.hasOwnProperty('tags') ? req.body.tags : [];
 

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
      const tagsInsert = tags.map(tagId => ({note_id: noteId, tag_id: tagId}));
      return knex.insert(tagsInsert).into('notes_tags');
    })
    .then(() => {
      return knex
        .select('notes.id', 'title', 'content', 'folder_id as folderId', 'folders.name as folderName')
        .from('notes')
        .leftJoin('folders', 'notes.folder_id', 'folders.id')
        .leftJoin('notes_tags', 'notes.id', 'notes_tags.note_id')
        .leftJoin('tags','tags.id','notes_tags.tag_id')
        .where('notes.id', noteId);
    })
    .then(result => {
      if (result) {
        const hydrated = hydrateNotes(result)[0];
        res.location(`${req.originalUrl}/${result.id}`).status(201).json(hydrated);
      } else {
        next();
      }
    })
    .catch(err => next(err));
});




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