'use strict';

const expect = require('chai').expect;
const mongodb = require('mongodb');
const mongoose = require('mongoose');

module.exports = function (app) {

  mongoose.connect(process.env.URL, { useNewUrlParser: true, useUnifiedTopology: true });

  const issueSchema = new mongoose.Schema({
    issue_title: {type: String, required: true},
    issue_text: {type: String, required: true},
    created_by: {type: String, required: true},
    assigned_to: String,
    status_text: String,
    open: {type: Boolean, required: true},
    created_on: {type: Date, required: true},
    updated_on: {type: Date, required: true},
    project: String
  })

  const Issue = mongoose.model('Issue', issueSchema);

  app.route('/api/issues/:project')
  
    .get(async (req, res) => {
      let project = req.params.project;
      let filter = Object.assign(req.query);
      filter['project'] = project;
      let arrayOfResults = await Issue.find(filter);
      try {
        if(arrayOfResults) {
          res.send(arrayOfResults);
        } else {
         res.send({error: 'required field(s) missing'});
        }
      } catch(error) {
        console.log(error);  
      } 
    })
    
    .post(async (req, res) => {
      let project = req.params.project;
      if(!req.body.issue_title || !req.body.issue_text || !req.body.created_by){
        return res.json({error: 'required field(s) missing'})
      }
      let newIssue = new Issue({
        issue_title: req.body.issue_title,
        issue_text: req.body.issue_text,
        created_by: req.body.created_by,
        assigned_to: req.body.assigned_to || '',
        status_text: req.body.status_text || '',
        open: true,
        created_on: new Date().toUTCString(),
        updated_on: new Date().toUTCString(),
        project: project
      })
      
      try{
        let savedIssue = await newIssue.save({});
        res.send(savedIssue);
      } catch (err) {
        console.log(err)
      }   
    })
    
    .put(async (req, res) => {
      let project = req.params.project;
      let updateObject = {};
      Object.keys(req.body).forEach((key) => {
        if(req.body[key] != ''){
          updateObject[key] = req.body[key]
        }
      })
      
      if(!updateObject._id){
        return res.json({error: 'missing _id'})  
      }
      
      if(Object.keys(updateObject).length < 2){
        return res.json({ error: 'no update field(s) sent', '_id': req.body._id })
      }
      updateObject['updated_on'] = new Date().toUTCString();

      try{
        let updatedIssue = await Issue.findOneAndUpdate({_id: req.body._id}, updateObject, {new: true});
        if(updatedIssue){
          return res.json({result: 'successfully updated', '_id': req.body._id})
        }else {
          return res.json({ error: 'could not update', '_id': req.body._id })
        }
      } catch (error) {
        return res.json({ error: 'could not update', '_id': req.body._id })
      }
    })
    
    
    .delete(async (req, res) => {
      let project = req.params.project;
      if(!req.body._id){
        return res.json({error: 'missing _id'})
      }
      try{
        let deletedIssue = await Issue.findOneAndDelete({_id: req.body._id});
          if(!deletedIssue){
            return res.json({error: 'could not delete', '_id': req.body._id})
          } else {
            return res.json({result: 'successfully deleted', '_id': req.body._id})
          }
      } catch (error) {
        return res.json({error: 'could not delete', '_id': req.body._id})
      }
      
    });
    
};
