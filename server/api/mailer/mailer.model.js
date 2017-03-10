import mongoose from 'mongoose';
import bcrypt   from 'bcryptjs';

const MailerSchema = new mongoose.Schema({
  name: String
});

export default mongoose.model('Mailer', MailerSchema);