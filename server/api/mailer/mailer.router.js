import router			from 'express';
import * as controller	from './mailer.controller';
import upload from '../../util/multer';

const MailerRouter = router();

MailerRouter.get('/counter', controller.counter);
MailerRouter.param('id', controller.params);

MailerRouter.route('/')
  .get(controller.get)
  .post(controller.post);

MailerRouter.route('/:id')
  .get(controller.getOne)
  .put(controller.put)
  .delete(controller.del);

MailerRouter.post('/uploadAttachment', controller.uploadAttachment);
MailerRouter.post('/modify', controller.modify);


export default MailerRouter;