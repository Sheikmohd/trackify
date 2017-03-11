import Jobs   from './jobs.model';
import _      from 'lodash';
import fs     from 'fs';
import path   from 'path';
import async  from 'async';

import upload from '../../util/multer';
import db     from '../../util/mysql';
import config	from '../../config/config';

// export const params = (req, res, next, id) => {
//   Jobs.findById(id)
//     .exec()
//     .then((jobs) => {
//       if (!jobs) {
//         return res.status(400).send({ message: 'Jobs not found' });
//       } else {
//         req.jobs = jobs;
//         next();
//       }
//     }, next);
// };

// export const get = (req, res, next) => {
//   Jobs.find({})
//     .exec()
//     .then((jobss) => {
//       res.send(jobss);
//     }, next);
// };

// export const getOne = (req, res) => {
//   res.send(req.jobs);
// };

// export const post = (req, res, next) => {
//   var newJobs = req.body;

//   Jobs.create(newJobs)
//     .then((created) => {
//       res.send(created);
//     }, next);
// };

// export const put = (req, res, next) => {
//   var {jobs, body} = req;

//   _.merge(jobs, body);

//   jobs.save()
//     .then((updated) => {
//       res.send(updated);
//     }, next);
// };

// export const del = (req, res, next) => {
//   req.jobs.remove()
//     .then((removed) => {
//       res.send(removed);
//     }, next);
// };

var resumeFilesPath = path.join(__dirname, '../../resume_files');
// Util functions
function twoDigits(d) {
    if(0 <= d && d < 10) return "0" + d.toString();
    if(-10 < d && d < 0) return "-0" + (-1*d).toString();
    return d.toString();
}

Date.prototype.toMysqlFormat = function() {
    return this.getUTCFullYear() + "-" + twoDigits(1 + this.getUTCMonth()) + "-" + twoDigits(this.getUTCDate()) + " " + twoDigits(this.getUTCHours()) + ":" + twoDigits(this.getUTCMinutes()) + ":" + twoDigits(this.getUTCSeconds());
};

export const getJobsDetail = function(req, res) {

    var userId = req.params.userId;
    var status = req.params.status === 'active' ? 1 : 0;
    var userOp = req.params.flag === 'myjob' ? '=' : '<>';
    var query = "select j.JOB_ID as jobId,j.USER_ID as jobCreatedById,u.NAME as jobCreatedByName,j.CREATED_ON as dateCreated,j.CLIENT_ID as clientId, c.CLIENT_NAME as clientName, j.DESIGNATION as designation,j.MIN_EXP as minExperience, j.MAX_EXP as maxExperience,s.SKILL as primarySkills, j.MAX_CTC as maxCTC from job j, user u, client c, job_skills as s where j.USER_ID=u.USER_ID and j.CLIENT_ID=c.CLIENT_ID and j.PRIMARY_SKILL=s.JOB_SKILL_ID and j.USER_ID " + userOp + " '" + userId + "' and j.ACTIVE = " + status;
    db.query(query, function(error, results) {
        if (error) {
            console.log(error);
            return res.status(400).send('ERROR');
        }
        if (results && results.length) {
            async.each(results, function(result, cb) {
                result.location = [];
                result.mailCount = 0;
                async.parallel([
                    function(callback) {
                        var qry = "select * from job_locations where JOB_ID=" + result.jobId;
                        db.query(qry, function(error, locations) {
                            if (error) {
                                return callback(error);
                            }
                            for (let location of locations) {
                                result.location.push(location.LOCATION);
                            }
                            callback(null);
                        });
                    }
                ], function(err, data) {
                    if (err) {
                        return cb(err);
                    }
                    cb();
                })
            }, function(err) {
                if (err) {
                    console.log(err);
                    return res.status(400).send("ERROR");
                }
                
                return res.send({ data: results });
            });
        } else {
            res.send({ data: [] });
        }
    });
};

export const candidateDetailsForJob = function(req, res) {

    var jobId = req.body.jobId;
    var filter = req.body.filter;
    var filterFrom = req.body.filterFrom;

    var query = "select cj.JOB_ID as jobId,cj.CANDIDATE_ID as candidateId,c.CANDIDATE_NAME as candidateName,c.COMPANY_NAME as presentEmployer,c.COLLEGE as college,cj.STAGE as stage, cj.STATUS as status,cj.STATUS_INPUTS as statusInputs,cj.RECRUITER_ID as assigneeId, u.NAME as assigneeName, cj.ROUND as round, cj.RESCHEDULE_REASON as rescheduleReason from candidate_job_mapping cj, candidate c, user u where cj.CANDIDATE_ID = c.CANDIDATE_ID and cj.RECRUITER_ID = u.USER_ID and cj.JOB_ID = " + jobId;

    if(filter.NEW.length ===  2 && filterFrom === 'job'){
        if((filter.NEW[0].filterTag && filter.NEW[0].filterValue && filter.NEW[0].filterValue.length > 0) && (filter.NEW[1].filterTag && filter.NEW[1].filterValue && filter.NEW[1].filterValue.length > 0)){
            query = query + " and ((cj.RECRUITER_ID in (";
            for(var i=0; i< filter.NEW[0].filterValue.length; i++){
                query = query + filter.NEW[0].filterValue[i]+",";
            }
            query = query.substring(0, query.length - 1) + ") and cj.STATUS = '"+filter.NEW[1].filterValue+"') or cj.STAGE <> 'NEW')";
        }
        else if(!(filter.NEW[0].filterTag && filter.NEW[0].filterValue) && (filter.NEW[1].filterTag && filter.NEW[1].filterValue && filter.NEW[1].filterValue.length > 0)){
            query = query + " and ((cj.STATUS = '"+filter.NEW[1].filterValue+"') or cj.STAGE <> 'NEW')";
        }
        else if((filter.NEW[0].filterTag && filter.NEW[0].filterValue) && !(filter.NEW[1].filterTag && filter.NEW[1].filterValue && filter.NEW[1].filterValue.length > 0)){
            query = query + " and ((cj.RECRUITER_ID in (";
            for(var i=0; i< filter.NEW[0].filterValue.length; i++){
                query = query + filter.NEW[0].filterValue[i]+",";
            }
            query = query.substring(0, query.length - 1) + ")) or cj.STAGE <> 'NEW')";
        }
    } else if(filter.SHORTLIST.length === 2 && filterFrom === 'job'){
        if((filter.SHORTLIST[0].filterTag && filter.SHORTLIST[0].filterValue) && (filter.SHORTLIST[1].filterTag && filter.SHORTLIST[1].filterValue && filter.SHORTLIST[1].filterValue.length > 0)){
            query = query + " and ((cj.RECRUITER_ID in (";
            for(var i=0; i< filter.SHORTLIST[0].filterValue.length; i++){
                query = query + filter.SHORTLIST[0].filterValue[i]+",";
            }
            query = query.substring(0, query.length - 1) + ") and cj.STATUS = '"+filter.SHORTLIST[1].filterValue+"') or cj.STAGE <> 'SHORTLIST')";
        }
        else if(!(filter.SHORTLIST[0].filterTag && filter.SHORTLIST[0].filterValue) && (filter.SHORTLIST[1].filterTag && filter.SHORTLIST[1].filterValue && filter.SHORTLIST[1].filterValue.length > 0)){
            query = query + " and ((cj.STATUS = '"+filter.SHORTLIST[1].filterValue+"') or cj.STAGE <> 'SHORTLIST')";
        }
        else if((filter.SHORTLIST[0].filterTag && filter.SHORTLIST[0].filterValue) && !(filter.SHORTLIST[1].filterTag && filter.SHORTLIST[1].filterValue && filter.SHORTLIST[1].filterValue.length > 0)){
            query = query + " and ((cj.RECRUITER_ID in (";
            for(var i=0; i< filter.SHORTLIST[0].filterValue.length; i++){
                query = query + filter.SHORTLIST[0].filterValue[i]+",";
            }
            query = query.substring(0, query.length - 1) + ")) or cj.STAGE <> 'SHORTLIST')";
        }
        
    } else if(filter.INTERVIEW.length === 4 && filterFrom === 'job'){
        var item1 = null;
        var item2 = null;
        var item3 = null;
        var item4 = null;

        if(filter.INTERVIEW[0].filterTag && filter.INTERVIEW[0].filterValue && filter.INTERVIEW[0].filterValue.length > 0){
            item1 = "(";
            for(var i=0; i< filter.INTERVIEW[0].filterValue.length; i++){
                item1 = item1 + filter.INTERVIEW[0].filterValue[i]+",";
            }
            item1 = item1.substring(0, item1.length - 1) + ")";
        }
        if(filter.INTERVIEW[1].filterTag && filter.INTERVIEW[1].filterValue){
            item2 = filter.INTERVIEW[1].filterValue;
        }
        if(filter.INTERVIEW[2].filterTag && filter.INTERVIEW[2].filterValue && filter.INTERVIEW[2].filterValue.length > 0){
            item3 = "";
            for(var i=0; i< filter.INTERVIEW[2].filterValue.length; i++){
                item3 = item3 + filter.INTERVIEW[2].filterValue[i]+"|";
            }
            item3 = item3.substring(0, item3.length - 1);
            item3 = "'"+item3+"'";
        }
        if(filter.INTERVIEW[3].filterTag && filter.INTERVIEW[3].filterValue){
            if(filter.INTERVIEW[3].filterTag === "status"){
                   item4 = "'"+filter.INTERVIEW[3].filterValue+"'";
            }
            else if((filter.INTERVIEW[3].filterTag === "filterBySelection" || filter.INTERVIEW[3].filterTag === "filterByRejection")&& filter.INTERVIEW[3].filterValue.length > 0){
                for(var i=0; i< filter.INTERVIEW[3].filterValue.length; i++){
                    item4 = item4 + filter.INTERVIEW[3].filterValue[i]+"|";
                }
                item4 = item4.substring(0, item4.length - 1);
                item4 = "'"+item4+"'";
            }
        }
        if(item1 || item2 || item3 || item4){
            query = query + " and ((";
            if(item1){
                query = query+"cj.RECRUITER_ID in "+item1+" and ";
            }
            if(item2){
                query = query+"cj.INTERVIEW_DATE = "+item2+" and ";
            }
            if(item3){
                query = query+"cj.STATUS_INPUTS REGEXP "+item3+" and ";
            }
            if(item4 && filter.INTERVIEW[3].filterTag === "status"){
                query = query+"cj.STATUS = "+item4+" and ";
            }
            if(item4 && (filter.INTERVIEW[3].filterTag === "filterBySelection" || filter.INTERVIEW[3].filterTag === "filterByRejection")){
                query = query+"cj.STATUS_INPUTS REGEXP "+item4+" and ";
            }
            query = query.substring(0, query.length - 5)+") or cj.STAGE <> 'INTERVIEW')";
        }

    } else if(filter.OFFER.length === 2 && filterFrom === 'job'){
        if((filter.OFFER[0].filterTag && filter.OFFER[0].filterValue) && (filter.OFFER[1].filterTag && filter.OFFER[1].filterValue  && filter.OFFER[1].filterValue.length > 0)){
            query = query + " and ((cj.RECRUITER_ID in (";
            for(var i=0; i< filter.OFFER[0].filterValue.length; i++){
                query = query + filter.OFFER[0].filterValue[i]+",";
            }
            query = query.substring(0, query.length - 1) + ") and cj.STATUS = '"+filter.OFFER[1].filterValue+"') or cj.STAGE <> 'OFFER')";
        }
        else if(!(filter.OFFER[0].filterTag && filter.OFFER[0].filterValue) && (filter.OFFER[1].filterTag && filter.OFFER[1].filterValue  && filter.OFFER[1].filterValue.length > 0)){
            query = query + " and ((cj.STATUS = '"+filter.OFFER[1].filterValue+"') or cj.STAGE <> 'OFFER')";
        }
        else if((filter.OFFER[0].filterTag && filter.OFFER[0].filterValue) && !(filter.OFFER[1].filterTag && filter.OFFER[1].filterValue  && filter.OFFER[1].filterValue.length > 0)){
            query = query + " and ((cj.RECRUITER_ID in (";
            for(var i=0; i< filter.OFFER[0].filterValue.length; i++){
                query = query + filter.OFFER[0].filterValue[i]+",";
            }
            query = query.substring(0, query.length - 1) + ")) or cj.STAGE <> 'OFFER')";
        }

    } else if(filter.JOINED.length === 2 && filterFrom === 'job'){
        if((filter.JOINED[0].filterTag && filter.JOINED[0].filterValue) && (filter.JOINED[1].filterTag && filter.JOINED[1].filterValue && filter.JOINED[1].filterValue.length > 0)){
            query = query + " and ((cj.RECRUITER_ID in (";
            for(var i=0; i< filter.JOINED[0].filterValue.length; i++){
                query = query + filter.JOINED[0].filterValue[i]+",";
            }
            query = query.substring(0, query.length - 1) + ") and cj.STATUS = '"+filter.JOINED[1].filterValue+"') or cj.STAGE <> 'JOINED')";
        }
        else if(!(filter.JOINED[0].filterTag && filter.JOINED[0].filterValue) && (filter.JOINED[1].filterTag && filter.JOINED[1].filterValue && filter.JOINED[1].filterValue.length > 0)){
            query = query + " and ((cj.STATUS = '"+filter.JOINED[1].filterValue+"') or cj.STAGE <> 'JOINED')";
        }
        else if((filter.JOINED[0].filterTag && filter.JOINED[0].filterValue) && !(filter.JOINED[1].filterTag && filter.JOINED[1].filterValue && filter.JOINED[1].filterValue.length > 0)){
            query = query + " and ((cj.RECRUITER_ID in (";
            for(var i=0; i< filter.JOINED[0].filterValue.length; i++){
                query = query + filter.JOINED[0].filterValue[i]+",";
            }
            query = query.substring(0, query.length - 1) + ")) or cj.STAGE <> 'JOINED')";
        }

    } else if(filter.CANDIDATE.length > 0 && filterFrom === 'candidate'){

    }

    db.query(query, function(error, results) {
        if (error) {
            res.send({"message": "ERROR"});
        } else {
            var resData = {"NEW":[], "SHORTLIST":[], "INTERVIEW": [], "OFFER":[], "JOINED":[], "CANDIDATE": []};
            if(results){
                for(var row of results){
                    if(row.statusInputs === null || row.statusInputs === ""){
                        row.statusInputs = null;
                    }else {
                        row.statusInputs = JSON.parse(row.statusInputs);
                    }
                    if(row.stage === "NEW"){
                        delete row.stage;
                        resData.NEW.push(row);
                    } else if(row.stage === "SHORTLIST"){
                        delete row.stage;
                        resData.SHORTLIST.push(row);
                    }else if(row.stage === "INTERVIEW"){
                        delete row.stage;
                        resData.INTERVIEW.push(row);
                    }else if(row.stage === "OFFER"){
                        delete row.stage;
                        resData.OFFER.push(row);
                    }else if(row.stage === "JOINED"){
                        delete row.stage;
                        resData.JOINED.push(row);
                    }
                }
            }
            res.send({"data": resData});
        }
    });
};

export const changeStatus = function(req, res) {

    var initialQuery = "select JOB_ID,CANDIDATE_ID,STAGE,STATUS,STATUS_INPUTS,RECRUITER_ID,TIMESTAMP from  candidate_job_mapping where JOB_ID = " + req.body.jobId + " and STAGE = '" + req.body.stage + "' and CANDIDATE_ID in (";
    var query = "update candidate_job_mapping  set STATUS = '" + req.body.status + "',STATUS_INPUTS='" + JSON.stringify(req.body.statusInputs) + "',RECRUITER_ID=" + req.body.statusChangedBy + " where JOB_ID = " + req.body.jobId + " and STAGE = '" + req.body.stage + "' and CANDIDATE_ID in (";

    for (var candidateId of req.body.candidateId) {
        initialQuery = initialQuery + "'" + candidateId + "',";
        query = query + "'" + candidateId + "',";
    }
    initialQuery = initialQuery.substring(0, initialQuery.length - 1) + ")";
    query = query.substring(0, query.length - 1) + ")";

    db.query(initialQuery, function(error, affectedRows) {
        if (error) {
            console.log(error);
            return res.status(400).send("error");
        } else {
            db.query(query, function(error, result) {
                if (error) {
                    console.log(error);
                    return res.status(400).send("error");
                }
                for(var i=0; i<affectedRows.length;i++) {
                    var date = (affectedRows[i].TIMESTAMP).toMysqlFormat();
                    var innerQuery = "insert into status_log(JOB_ID,CANDIDATE_ID,STAGE,STATUS,STATUS_INPUTS,RECRUITER_ID,TIMESTAMP) values('"+affectedRows[i].JOB_ID+"','"+affectedRows[i].CANDIDATE_ID+"','"+affectedRows[i].STAGE+"','"+affectedRows[i].STATUS+"','"+affectedRows[i].STATUS_INPUTS+"','"+affectedRows[i].RECRUITER_ID+"','"+date+"')";
                    
                    db.query(innerQuery, function(error, result) {
                        if (error) {
                            console.log(error);
                        }
                    });
                }
                res.json({ "message": "SUCCESS" });
            });
        }
    });
};

export const moveToNextStage = function(req, res) {

    var date = new Date(req.body.timestamp).toISOString().slice(0, 19).replace('T', ' ');

    var query = "update candidate_job_mapping  set STAGE = '" + req.body.assignStageTo + "', STATUS='', STATUS_INPUTS='',RECRUITER_ID=" + req.body.userId + ",TIMESTAMP='" + date + "' where JOB_ID = " + req.body.jobId + " and STAGE = '" + req.body.assignStageFrom + "' and CANDIDATE_ID in (";
    for (var candidateId of req.body.candidateId) {
        query = query + "'" + candidateId + "',";
    }
    query = query.substring(0, query.length - 1) + ")";
    
    db.query(query, function(error, result) {
        if (error) {
            console.log(error);
            return res.status(400).send("error");
        }
        res.json({ "message": "SUCCESS" });
    });
};

export const addInterviewDate = function(req, res) {

    var date = new Date(req.body.timestamp).toMysqlFormat();

    var query = "update candidate_job_mapping set INTERVIEW_DATE = '" + req.body.interview.date + "',INTERVIEW_TIME='" + req.body.interview.time + "',MERIDIAN='" + req.body.interview.meridian + "',ROUND=" + req.body.interview.round + ",RESCHEDULE_REASON = '" + req.body.interview.rescheduleReason + "',TIMESTAMP='" + date + "' where JOB_ID=" + req.body.jobId + " and STAGE='" + req.body.stage + "' and CANDIDATE_ID IN ("+req.body.candidateId+")";
    
    db.query(query, function(error, result) {
        if (error) {
            console.log(error);
            return res.status(400).send("error");
        }
        res.json({ "message": "SUCCESS" });
    });
};

export const getAllActiveJobs = function(req, res) {

    var query = "select j.JOB_ID as jobId,j.USER_ID as jobCreatedById,u.NAME as jobCreatedByName,j.CREATED_ON as dateCreated,j.CLIENT_ID as clientId, c.CLIENT_NAME as clientName, j.DESIGNATION as designation,j.MIN_EXP as minExperience, j.MAX_EXP as maxExperience,s.SKILL as primarySkills from job j,user u, client c, job_skills s where j.USER_ID=u.USER_ID and j.CLIENT_ID=c.CLIENT_ID and j.PRIMARY_SKILL=s.JOB_SKILL_ID and j.ACTIVE = 1";
    db.query(query, function(error, results) {
        if (error) {
            console.log(error);
            return res.status(400).send('ERROR');
        }
        if (results && results.length) {
            async.each(results, function(result, cb) {
                result.location = [];
                //result.primarySkills = [];
                result.mailCount = 0;
                async.parallel([
                    function(callback) {
                        var qry = "select * from job_locations where JOB_ID=" + result.jobId;
                        db.query(qry, function(error, locations) {
                            if (error) {
                                return callback(error);
                            }
                            for (let location of locations) {
                                result.location.push(location.LOCATION);
                            }
                            callback(null);
                        });
                    }
                ], function(err, data) {
                    if (err) {
                        return cb(err);
                    }
                    cb();
                })
            }, function(err) {
                if (err) {
                    console.log(err);
                    return res.status(400).send("ERROR");
                }
                return res.send({ data: results });
            });
        } else {
            res.send({ data: [] });
        }
    });
};

export const getSimilarJobs = function(req, res) {

    var primarySkill = (req.body.primarySkill+"").toUpperCase();
    var designation = (req.body.designation+"").toUpperCase();
    var experience = req.body.experience;

    if(primarySkill && designation && experience){
        var query = "select j.JOB_ID as jobId,j.USER_ID as userId,u.NAME as userName,c.CLIENT_NAME as clientName,j.CLIENT_ID as clientId,j.DESIGNATION as designation from job j, client c, user u, job_skills as js where j.CLIENT_ID=c.CLIENT_ID and j.USER_ID=u.USER_ID and j.PRIMARY_SKILL=js.JOB_SKILL_ID and js.SKILL='"+primarySkill+"' and j.DESIGNATION='"+designation+"' and (j.MIN_EXP <= "+experience+" or j.MAX_EXP >= "+experience+");";
        db.query(query, function(error, records) {
            if (error) {
                console.log(error);
                return res.status(400).send("ERROR");
            }
            res.json({ "data": records });
        });
    } else {
        res.json({"message": "BAD REQUEST"});
    }
};

export const moveToActiveJob = function(req, res) {

    var reqData = {
        "jobId": req.body.jobId,
        "candidateIds": req.body.candidateId,
        "recruiterId": req.body.userId,
    };
    console.log(reqData.candidateIds);
    
    if(reqData.jobId && reqData.recruiterId && reqData.candidateIds && reqData.candidateIds.length > 0){
        var date = new Date().toMysqlFormat();
        var query = "insert into candidate_job_mapping(JOB_ID,CANDIDATE_ID,RECRUITER_ID,TIMESTAMP,STAGE, STATUS) values";
        for(let i=0; i < reqData.candidateIds.length; i++){
            query = query+"("+reqData.jobId+","+reqData.candidateIds[i]+","+reqData.recruiterId+",'"+date+"','NEW','NEW RESUME'),";
        }
        query = query.substring(0, query.length-1);

        db.query(query, function(error, skills) {
            if (error) {
                console.log(error);
                return res.status(400).send("ERROR");
            }
            res.json({ "message": "SUCCESS" });
        });
    } else {
        res.json({"message": "Bad request"});
    }
};

export const moveToInactiveJob = function(req, res) {

    var date = new Date(req.body.timestamp).toISOString().slice(0, 19).replace('T', ' ');

    var query = "update job set ACTIVE = 0, COMMENTS ='" + req.body.reason + "', CREATED_ON ='"+ date+"' where JOB_ID=" + req.body.jobId;

    db.query(query, function(error, skills) {
        if (error) {
            console.log(error);
            return res.status(400).send("ERROR");
        }
        res.json({ "message": "SUCCESS" });
    });
};

export const getResumeMetadata = function(req, res) {

    var query = "select * from candidate where CANDIDATE_ID=" + req.params.candidateId;
    db.query(query, function(error, data) {
        if (error) {
            console.log(error);
            return res.status(400).send("ERROR");
        } else {
            if(data[0] && data[0].ORIGINAL_FILE_NAME){
                var pathURL = "https://docs.google.com/viewer?url="+config.appHostName+"/resume_files/"+data[0].HASH_FILE_NAME+"&embedded=true";
                res.json({ "isResumeFound": true, "pathURL": pathURL });
            } else {
                res.json({ "isResumeFound": false, "pathURL": null });
            }
        }
    });
};

export const uploadResume = function(req, res) {
    upload(req, res, function(err) {
        if (err) {
            console.log(error);
            res.send({ "message": "ERROR" });
        } else {
            var data = {
                "candidateId": req.body.candidateId,
                "originalFileName": req.file.originalname,
                "hashFileName": req.file.filename,
                "encoding": req.file.encoding,
                "mimetype": req.file.mimetype,
                "uploadDate": req.body.uploadDate
            };
        
            var oldPath = path.join(resumeFilesPath, data.hashFileName);
            var newPath = path.join(resumeFilesPath, data.hashFileName);
            if(data.mimetype == "application/msword"){
                newPath = newPath+".doc";
                data.hashFileName = data.hashFileName+".doc";
            } else if(data.mimetype == "application/vnd.openxmlformats-officedocument.wordprocessingml.document"){
                newPath = newPath+".docx";
                data.hashFileName = data.hashFileName +".docx";
            } else if(data.mimetype == "application/pdf"){
                newPath = newPath+".pdf"
                data.hashFileName = data.hashFileName +".pdf"
            }
            
            fs.rename(oldPath, newPath, function (err) {
                if(err){
                    console.log(err);
                    res.json({"message": "ERROR"});
                } else {
                    
                    var date = new Date(req.body.uploadDate).toISOString().slice(0, 19).replace('T', ' ');
                    var query = "update candidate set ORIGINAL_FILE_NAME='" + req.file.originalname + "',HASH_FILE_NAME = '" + data.hashFileName + "',MIMETYPE='" + req.file.mimetype + "',ENCODING='" + req.file.encoding + "',UPLOAD_DATE='" + date + "' where CANDIDATE_ID=" + req.body.candidateId;
                    db.query(query, function(error, data) {
                        if (error) {
                            console.log(error);
                            return res.status(400).send("ERROR");
                        }
                        res.send({ "message": "SUCCESS" });
                    });
                }
            });
        }
    });
};

export const uploadNewCandidateResume = function(req, res){

    upload(req, res, function(err) {
        if (err) {
            console.log(err);
            res.send({ "message": "ERROR" });
        } else {
            var data = {
                "candidateName": req.body.candidateName,
                "candidateEmail": req.body.candidateEmail,
                "candidateContact": req.body.candidateContact,
                "jobId": req.body.jobId,
                "recruiterId": req.body.recruiterId,
                "originalFileName": req.file.originalname,
                "hashFileName": req.file.filename,
                "encoding": req.file.encoding,
                "mimetype": req.file.mimetype,
                "uploadDate": req.body.uploadDate
            };
            var oldPath = path.join(resumeFilesPath, data.hashFileName);
            var newPath = path.join(resumeFilesPath, data.hashFileName);
            if(data.mimetype == "application/msword"){
                newPath = newPath+".doc";
                data.hashFileName = data.hashFileName+".doc";
            } else if(data.mimetype == "application/vnd.openxmlformats-officedocument.wordprocessingml.document"){
                newPath = newPath+".docx";
                data.hashFileName = data.hashFileName +".docx";
            } else if(data.mimetype == "application/pdf"){
                newPath = newPath+".pdf"
                data.hashFileName = data.hashFileName +".pdf"
            }
            fs.rename(oldPath, newPath, function (err) {
                if(err){
                    console.log(err);
                    res.json({"message": "ERROR"});
                } else {
                    var date = new Date(req.body.uploadDate).toISOString().slice(0, 19).replace('T', ' ');

                    var queryDuplicateCheck = "select * from candidate where EMAIL='"+req.body.candidateEmail+"' or PHONE_NO='"+req.body.candidateContact+"'";
                    db.query(queryDuplicateCheck, function(error, rows) {
                        if (error) {
                            console.log(error);
                            return res.status(400).send({"message": "ERROR"});
                        } else {
                            if(rows.length != 0){
                                res.send({"message": "DUPLICATE"});
                            } else {
                                var queryForCandidate = "insert into candidate(CANDIDATE_NAME, EMAIl, PHONE_NO, ORIGINAL_FILE_NAME, HASH_FILE_NAME, MIMETYPE, UPLOAD_DATE, ENCODING) values ('"+ req.body.candidateName+"','"+req.body.candidateEmail+"','"+req.body.candidateContact+"','"                 +req.file.originalname+"','"+data.hashFileName+"','"+req.file.mimetype+"','"+date+"','"+req.file.encoding+"')";
                                var queryGetCandidateId = "Select CANDIDATE_ID from candidate where EMAIL='"+req.body.candidateEmail+"' and PHONE_NO='"+req.body.candidateContact+"'";

                                db.query(queryForCandidate, function(error, data) {
                                    if (error) {
                                        console.log(error);
                                        return res.status(400).send("ERROR");
                                    }
                                    db.query(queryGetCandidateId, function(error, data) {
                                        if (error) {
                                            console.log(error);
                                            return res.status(400).send("ERROR");
                                        }
                                        var candidateId = data[0].CANDIDATE_ID;
                                        var queryForCandidateJobMapping = "insert into candidate_job_mapping(JOB_ID,CANDIDATE_ID,STATUS,STAGE,RECRUITER_ID,TIMESTAMP) values ('"+req.body.jobId+"','"+candidateId+"','NEW RESUME','NEW','"+req.body.recruiterId+"','"+date+"')";
                                        db.query(queryForCandidateJobMapping, function(error, data) {
                                            if (error) {
                                                console.log(error);
                                                return res.status(400).send("ERROR");
                                            }
                                            res.send({ "message": "SUCCESS" });
                                        });
                                    });
                                });
                            }
                        }
                    });
                }
            });
        }
    });
};

export const candidateDetails = function(req, res) {

    var query = "select CANDIDATE_ID as candidateId,CANDIDATE_NAME as candidateName,EMAIL as email,PHONE_NO as contact,EXPERIENCE as experience,COMPANY_NAME as employer, COLLEGE as college, CTC_FIXED as ctcFixed,CTC_VAR as ctcVariable,CTC_ESOPS as ctcEsops,ECTC_FIXED as eCTCFixed, ECTC_VAR as eCTCVariable, ECTC_ESOPS as eCTCEsops,NOTICE_PERIOD as noticePeriod,if(SERVING_NOTICE_PERIOD = 1,'true','false') as serveNotice,JOB_LOCATION as location from candidate where CANDIDATE_ID=" + req.params.candidateId;
    db.query(query, function(error, data) {
        if (error) {
            console.log(error);
            return res.status(400).send("ERROR");
        }
        res.json(data ? data[0] : {});
    });
};

export const updateCandidateDetails = function(req, res) {
   
    if(req.body.candidateName != null && req.body.email != null && req.body.experience != null && req.body.ctcFixed != null 
        && req.body.ctcVariable != null && req.body.ctcEsops != null && req.body.eCTCFixed != null && req.body.eCTCVariable != null 
        && req.body.eCTCEsops != null && req.body.location != null && req.body.candidateId != null) {
            
            var query = "update candidate set CANDIDATE_NAME='" + req.body.candidateName + "',EMAIL='" + req.body.email + "',PHONE_NO='" + req.body.contact + "',EXPERIENCE=" + req.body.experience + ",COMPANY_NAME='" + req.body.employer + "',CTC_FIXED=" + req.body.ctcFixed + ",CTC_VAR=" + req.body.ctcVariable + ",CTC_ESOPS=" + req.body.ctcEsops + ",ECTC_FIXED=" + req.body.eCTCFixed + ",ECTC_VAR=" + req.body.eCTCVariable + ",ECTC_ESOPS=" + req.body.eCTCEsops + ",NOTICE_PERIOD=" + req.body.noticePeriod + ",SERVING_NOTICE_PERIOD=" + (req.body.serveNotice ? 1 : 0) + ",JOB_LOCATION='" + req.body.location + "' where CANDIDATE_ID=" + req.body.candidateId;
            
            db.query(query, function(error, data) {
                if (error) {
                    console.log(error);
                    return res.status(400).send("ERROR");
                }
                res.json({ "message": "SUCCESS" });
            });
        } else {
            res.json({"message": "Bad request"});
        }
};

// Recursive function to be used by savePostMessage()
function extractUserId(userNameArr, message) {
    var firstChar = message.charAt(0);
    if(firstChar === " "){
        return extractUserId(userNameArr, message.substr(1));
    } else if(firstChar === "@"){
        var idx = message.indexOf(" ");
        userNameArr.push(message.substr(1,idx-1));
         return extractUserId(userNameArr, message.substr(idx));
    } else {
        return {"userNames": userNameArr, "message": message};
    }
}
export const savePostMessage = function(req, res) {

    var userId = req.body.userId;
    var jobId = req.body.jobId;
    var candidateId = req.body.candidateId;
    var message = (req.body.message).trim();
    var messageType = "";

    if(userId && jobId && candidateId && message && message.length !== 0){
        var obj = extractUserId([], message);
        var date = new Date().toMysqlFormat();

        if(obj.userNames.length == 0){
            messageType = "NOTE";
            var query = "insert into candidate_feed(CANDIDATE_ID,JOB_ID,USER_ID,FEED_TEXT,FEED_TYPE,TIME_SENT) values("+candidateId+","+jobId+","+userId+",'"+message+"','"+messageType+"','"+date+"')";

            db.query(query, function(error, data) {
                if (error) {
                    console.log(error);
                    return res.status(400).send("ERROR");
                }
                res.json({ "message": "SUCCESS" });
            });
        } else {
            messageType = "TAG";
            var getQuery = "select USER_ID, USERNAME from user where USERNAME IN (";
            for(var elem of obj.userNames){
                getQuery = getQuery+"'"+elem+"',";
            }
            getQuery = getQuery.substr(0,getQuery.length-1)+")";
            db.query(getQuery, function(error, data) {
                if (error) {
                    console.log(error);
                    return res.status(400).send("ERROR");
                }
                if(obj.userNames.length === data.length){

                    var queryCandidateFeed = "insert into candidate_feed(CANDIDATE_ID,JOB_ID,USER_ID,FEED_TEXT,FEED_TYPE,TIME_SENT) values ("+candidateId+","+jobId+","+userId+",'"+obj.message+"','"+messageType+"','"+date+"')";

                    db.query(queryCandidateFeed, function(error, data2) {
                        if (error) {
                            console.log(error);
                            return res.status(400).send("ERROR");
                        } else {
                            var queryFeedTarget = "insert into feed_target(FEED_ID,TARGET_ID) values ";
                            for(var i=0; i<obj.userNames.length; i++){
                                for(var j=0; j<data.length; j++){
                                    if(obj.userNames[i] === data[j].USERNAME){
                                        queryFeedTarget = queryFeedTarget+"("+data2.insertId+","+data[j].USER_ID+"),";
                                        break;
                                    }
                                }
                            }
                            queryFeedTarget = queryFeedTarget.substr(0, queryFeedTarget.length-1)+";";
                            db.query(queryFeedTarget, function(error, done2) {
                                if (error) {
                                    console.log(error);
                                    return res.status(400).send("ERROR");
                                }
                                res.json({ "message": "SUCCESS" });
                            });
                        }
                    });
                } else {
                    var badUserName = [];
                    for(var i=0; i<obj.userNames.length; i++){
                        var flag = false;
                        for(var j=0; j<data.length; j++){
                            if(obj.userNames[i] === data[j].USERNAME){
                                flag = true;
                                break;
                            }
                        }
                        if(!flag){
                            badUserName.push(obj.userNames[i]);
                        }
                    }
                    res.json({"message": "BAD TAGS", "badUsernames": badUserName});
                }
            });
        }
    } else {
        res.json({"message": "BAD REQUEST"});
    }
};

export const feedJobData = function(req, res) {

    var candidateId = req.params.candidateId;

    async.parallel({
        currentJobs: function(callback) {
            var queryCurrentJobs = "select cjm.JOB_ID as jobId,cjm.RECRUITER_ID as userId,u.NAME as userName,c.CLIENT_NAME as clientName,j.DESIGNATION as designation,cjm.STATUS as status from candidate_job_mapping cjm, user u,client c,job j where cjm.RECRUITER_ID=u.USER_ID and cjm.JOB_ID=j.JOB_ID and j.CLIENT_ID=c.CLIENT_ID and j.ACTIVE=1 and cjm.STATUS NOT IN ('DUPLICATE', 'SCREEN REJECT','AVAILABLE LATER','NOT INTERESTED','CANDIDATE DROPPED','INTERVIEW REJECT','NO SHOW','OFFER DENIED','OFFER REJECTED','OFFERED+DUPLICATE','JOINED','ABSCONDING') and cjm.CANDIDATE_ID="+candidateId;
            db.query(queryCurrentJobs, function(error, data) {
                if (error) {
                    console.log(error);
                    callback(err);
                }
                callback(null, data);
            });
        },
        previousJobs: function(callback) {
            var queryPreviousJobs = "select cjm.JOB_ID as jobId,cjm.RECRUITER_ID as userId,u.NAME as userName,c.CLIENT_NAME as clientName,j.DESIGNATION as designation,cjm.STATUS as status from candidate_job_mapping cjm, user u,client c,job j where cjm.RECRUITER_ID=u.USER_ID and cjm.JOB_ID=j.JOB_ID and j.CLIENT_ID=c.CLIENT_ID and (j.ACTIVE=0 or cjm.STATUS IN ('DUPLICATE', 'SCREEN REJECT','AVAILABLE LATER','NOT INTERESTED','CANDIDATE DROPPED','INTERVIEW REJECT','NO SHOW','OFFER DENIED','OFFER REJECTED','OFFERED+DUPLICATE','JOINED','ABSCONDING')) and cjm.CANDIDATE_ID="+candidateId;
            db.query(queryPreviousJobs, function(error, data) {
                if (error) {
                    console.log(error);
                    callback(err);
                }
                callback(null, data);
            });
        }
    }, function(err, results) {
        if(err){
            res.json({"message": "Something went wrong. Please try later."});
        }
        results.candidateId = candidateId;
        res.json(results);
    });
};

export const getFeedThread = function(req, res) {

    var jobId = req.params.jobId;
    var candidateId = req.params.candidateId;

    async.parallel({
        TAGS: function(callback) {
            var query = "SELECT cf.FEED_TEXT as message, cf.TIME_SENT as timestamp, u.NAME as sentFrom, GROUP_CONCAT(ft.USERNAME) as sentTo FROM candidate_feed cf, (select * from feed_target f, user u where u.USER_ID=f.TARGET_ID) ft, user u where cf.FEED_ID=ft.FEED_ID and cf.USER_ID=u.USER_ID and cf.JOB_ID="+jobId+" and cf.CANDIDATE_ID="+candidateId+" group by cf.FEED_ID;";
            db.query(query, function(error, data) {
                if (error) {
                    callback(error);
                } else {
                    callback(null, data);
                }
            });
        },
        NOTES: function(callback) {
            var query = "select u.NAME as savedBy, cf.FEED_TEXT as message, cf.TIME_SENT as timestamp from candidate_feed cf, user u where cf.USER_ID=u.USER_ID and cf.FEED_TYPE='NOTE' and cf.JOB_ID="+jobId+" and cf.CANDIDATE_ID="+candidateId+";";
            db.query(query, function(error, data) {
                if (error) {
                    callback(error);
                } else {
                    callback(null, data);
                }
            });
        },
        STATUS: function(callback) {
            var query1 = "select cjm.STATUS as status,u.NAME as changedBy,cjm.TIMESTAMP as timestamp from candidate_job_mapping cjm, user u where cjm.RECRUITER_ID=u.USER_ID and cjm.RECRUITER_ID="+jobId+" and cjm.CANDIDATE_ID="+candidateId;
            var query2 = "select sl.STATUS as status,u.NAME as changedBy,sl.TIMESTAMP as timestamp from status_log sl, user u where sl.RECRUITER_ID=u.USER_ID and sl.RECRUITER_ID="+jobId+" and sl.CANDIDATE_ID="+candidateId;
            var query = query1+" UNION "+ query2+";";
            db.query(query, function(error, data) {
                if (error) {
                    callback(error);
                } else {
                    callback(null, data);
                }
            });
        }
    }, function(err, results){
        if(err){
            console.log(err);
            res.json({"message": "Something went wrong. Please try later."});
        } else {
            res.json(results);
        }
    });
};

export const allRecruiters = function(req, res) {

    var query = "select USER_ID as userId,NAME as userName from USER";
    db.query(query, function(error, data) {
        if (error) {
            console.log(error);
            return res.status(400).send("ERROR");
        }
        res.json({ data: data });
    });
};

export const linkedinLink = function(req, res) {

    var query = "select LINKEDIN_LINK from candidate where CANDIDATE_ID=" + req.params.candidateId;
    db.query(query, function(error, data) {
        if (error) {
            console.log(error);
            return res.status(400).send("ERROR");
        }
        if(data[0].LINKEDIN_LINK == null || data[0].LINKEDIN_LINK == ""){
            res.json({ linkedinLink: "NOT FOUND"});
        } else {
            res.json({ linkedinLink: data[0].LINKEDIN_LINK});
        }
    });
};

export const internalDataCandidateList = function(req, res) {

    var reqData = {
        jobId: req.body.jobId,
        clientName: req.body.clientName,
        designation: req.body.designation,
        location: req.body.location,
        minExp: req.body.minExp,
        maxExp: req.body.maxExp,
        maxCTC: req.body.maxCTC,
        primarySkill: req.body.primarySkill,
        skip: req.body.skip
    };
    
    var query = "select JOB_SKILL_ID from job_skills where SKILL='"+reqData.primarySkill+"'";
    
    db.query(query, function(error, data) {
        if (error) {
            console.log(error);
            return res.status(400).send("ERROR");
        } else {
            if(data.length != 1){
                res.json({"message": "PRIMARY SKILL NOT FOUND"});
            } else {
                let skillId = data[0].JOB_SKILL_ID;
                var query2 = "select c.CANDIDATE_ID as candidateId, c.CANDIDATE_NAME as candidateName, c.COMPANY_NAME as presentEmployer, c.COLLEGE as college from candidate c, candidate_job_mapping cjm, job j where j.JOB_ID=cjm.JOB_ID and c.CANDIDATE_ID=cjm.CANDIDATE_ID and j.PRIMARY_SKILL="+skillId+" and j.DESIGNATION='"+reqData.designation+"' and j.JOB_ID <> "+reqData.jobId+" and cjm.CANDIDATE_ID not in (select CANDIDATE_ID from candidate_job_mapping where JOB_ID = "+ reqData.jobId+")"+" and c.EXPERIENCE >= "+reqData.minExp+" and c.EXPERIENCE <= "+reqData.maxExp+ " and c.CTC_FIXED <="+ reqData.maxCTC;
                
                if(reqData.location.length > 0){
                    query2 = query2+ " and c.JOB_LOCATION in (";
                    for(let i=0; i<reqData.location.length; i++){
                        query2 = query2+"'"+reqData.location[i]+"',";
                    }
                    query2 = query2.substring(0, query2.length-1)+")";
                }
                
                db.query(query2, function(error, data2) {
                    if (error) {
                        console.log(error);
                        return res.status(400).send("ERROR");
                    } else {
                        var resObj = {"count": data2.length};
                        resObj.data = [];
                        if(data2.length !=0 && reqData.skip >= data2.length) {
                            res.send({"message": "SKIP LIMIT OUTBOUND"});
                        } else {
                            let ctr = 0;
                            let initVar = (reqData.skip === 0) ? 0 : reqData.skip-1;
                             for(let i=initVar; i<data2.length; i++){
                                 resObj.data.push(data2[i]);
                                 ctr++;
                                 if(ctr === 50)
                                    break;
                             }
                             console.log(resObj);
                             res.json(resObj);
                        } 
                    }
                });
            }    
        }   
    });
};


export const invalidRequest = function(req, res) {
    res.send({"message": "Invalid Request"});
};
