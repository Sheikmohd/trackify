import router			from 'express';
import * as controller	from './jobs.controller';
import {verifyUser}		from '../../auth/auth-util';

const JobsRouter = router();

// JobsRouter.param('id', controller.params);

// JobsRouter.route('/')
//   .get(controller.get)
//   .post(controller.post);

// JobsRouter.route('/:id')
//   .get(controller.getOne)
//   .put(controller.put)
//   .delete(controller.del);

JobsRouter.get('/getJobsDetail/:userId/:flag/:status', verifyUser, controller.getJobsDetail);

JobsRouter.post('/candidateDetailsForJob', verifyUser, controller.candidateDetailsForJob);

JobsRouter.post('/changeStatus', verifyUser, controller.changeStatus);

JobsRouter.post('/moveToNextStage', verifyUser, controller.moveToNextStage);

JobsRouter.post('/addInterviewDate', verifyUser, controller.addInterviewDate);

JobsRouter.get('/getAllActiveJobs', verifyUser, controller.getAllActiveJobs);

JobsRouter.post('/getSimilarJobs', verifyUser, controller.getSimilarJobs);

JobsRouter.post('/moveToActiveJob', verifyUser, controller.moveToActiveJob);

JobsRouter.post('/moveToInactiveJob', verifyUser, controller.moveToInactiveJob);

JobsRouter.get('/getResumeMetadata/:candidateId', verifyUser, controller.getResumeMetadata);

JobsRouter.post('/uploadResume', verifyUser, controller.uploadResume);

JobsRouter.post('/uploadNewCandidateResume', verifyUser, controller.uploadNewCandidateResume);

JobsRouter.get('/candidateDetails/:candidateId', verifyUser, controller.candidateDetails);

JobsRouter.post('/updateCandidateDetails', verifyUser, controller.updateCandidateDetails);

JobsRouter.post('/savePostMessage', verifyUser, controller.savePostMessage);

JobsRouter.get('/feedJobData/:candidateId', verifyUser, controller.feedJobData);

JobsRouter.get('/getFeedThread/:jobId/:candidateId', verifyUser, controller.getFeedThread);

JobsRouter.get('/allRecruiters', verifyUser, controller.allRecruiters);

JobsRouter.get('/linkedinLink/:candidateId', verifyUser, controller.linkedinLink);

JobsRouter.post('/internalDataCandidateList', controller.internalDataCandidateList);

//Discarded APIs
JobsRouter.all('/*', controller.invalidRequest);

export default JobsRouter;