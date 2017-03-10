import Mailer from './mailer.model';
import _ from 'lodash';
import * as postman from './mailer.postman';
import upload from '../../util/multer';
import path   from 'path';

var upload_path = path.join(__dirname, 'resume_files');

export const params = (req, res, next, id) => {
    next();
};

export const get = (req, res, next) => {
    // postman.send(newMailer)
    // Mailer.find({})
    //   .exec()
    //   .then((mailers) => {
    //     res.send(mailers);
    //   }, next);
    if (req.query.label) {
        postman.inbox(req.query, function(messages) {
            res.send(messages);
        });
    } else {
        res.setStatus = 400;
        res.send({ status: 400, msg: "Bad request" });
    }
};

export const getOne = (req, res) => {
    postman.readMessage(req, function(message){
        res.send(message);
    });
    // res.send(req.mailer);
};

export const post = (req, res, next) => {
    var newMailer = req.body;
    postman.send(newMailer, function(data){
        res.send(data);
    })
    console.log(newMailer)

};

export const put = (req, res, next) => {
    var { mailer, body } = req;

    _.merge(mailer, body);

    mailer.save()
        .then((updated) => {
            res.send(updated);
        }, next);
};

export const del = (req, res, next) => {
    postman.trash(req, function(message){
        res.send(message);
    })
};

export const uploadAttachment = (req, res, next) => {
    upload(req, res, function(err){
        if(err){
            res.setStatus = 500;
            res.send({status:500, msg:"Unable to upload file."});
        }else{
            console.log(req.file)
            res.send({status:200, fileName:req.file.filename, originalFileName:req.file.originalname, mimetype:req.file.mimetype});
        }
    });
}

export const modify = (req, res, next) => {
    postman.modify(req.body, function(response){
        res.send(response);
    })
}

export const counter = (req, res, next) => {
    postman.fetchCount(req.query, function(response){
        res.send(response);
    })
}
