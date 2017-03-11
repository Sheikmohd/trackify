import router			from 'express';
import UserRouter		from './users/user.router';
import MembersRouter	from './members/members.router';
import JobsRouter       from './jobs/jobs.router';
import CandidateRouter  from './candidate/candidate.router';
import NewJobRouter     from './newjob/newjob.router'
import Mailer     from './mailer/mailer.router'

const ApiRouter = router();

ApiRouter.use('/users',	UserRouter);
ApiRouter.use('/members', MembersRouter);
ApiRouter.use('/jobs', JobsRouter);
ApiRouter.use('/candidate', CandidateRouter);
ApiRouter.use('/newjob', NewJobRouter);
ApiRouter.use('/mailer', Mailer);

export default ApiRouter;       