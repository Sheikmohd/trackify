import router			from 'express';
import * as controller	from './mailer.controller';
import upload from '../../util/multer';
import {verifyUser}		from '../../auth/auth-util';

const MailerRouter = router();

MailerRouter.get('/counter', verifyUser, controller.counter);
MailerRouter.param('id', controller.params);

MailerRouter.route('/')
  .get(verifyUser, controller.get)
  .post(verifyUser, controller.post);

MailerRouter.route('/:id')
  .get(verifyUser, controller.getOne)
  .put(verifyUser, controller.put)
  .delete(verifyUser, controller.del);

MailerRouter.post('/uploadAttachment', verifyUser, controller.uploadAttachment);
MailerRouter.post('/modify', verifyUser, controller.modify);


export default MailerRouter;