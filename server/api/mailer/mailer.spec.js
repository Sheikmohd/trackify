import mongoose from 'mongoose';
import sinon    from 'sinon';
import request  from 'supertest';
import {expect} from 'chai';
import app      from '../../server';
import Mailer      from './mailer.model';

const dbURI   = 'mongodb://localhost:27017/testingDB';
const clearDB = require('mocha-mongoose')(dbURI);

const testMailer = { 
  name: 'joe'
}

const createMailer = () => Mailer.create(testMailer);

describe('Mailer model', () => {

  beforeEach('Establish DB connection', (done) => {
    if (mongoose.connection.db) return done();
    mongoose.connect(dbURI, done);
  });

  afterEach('Clear test database', (done) => clearDB(done));  

  it('should exist', () => {
    expect(Mailer).to.be.a('function');
  });

  describe('Creation', (done) => {

    afterEach('Clear test database', done => clearDB(done));

    it('should exist', (done) => {
      createMailer()
        .then( mailer => {
          expect(mailer.name).to.equal('joe');
          done();
        })
    });
  });
});

describe('Mailer Router', () => {

  beforeEach('Establish DB connection', (done) => {
    if (mongoose.connection.db) return done();
    mongoose.connect(dbURI, done);
  });

  afterEach('Clear test database', done => clearDB(done));

  describe('Should be REST-ful', () => {

    let agent;
    let newMailerId;

    beforeEach('Create guest agent', (done) => {
      agent = request.agent(app);
      createMailer().then((mailer) => {
        newMailerId = mailer._id
        done()
      });
    });

    afterEach('Clear test database', done => clearDB(done));

    it('Should get all', (done) => {
      agent
        .get('/api/mailer')
        .expect(200)
        .expect(res => {
          if(res.body[0].name !== 'joe') throw new Error('not found')
        })
        .end(done);
    });

    it('Should create', (done) => {
      agent
        .post(`/api/mailer/`)
        .send({name: 'david'})
        .expect(200)
        .expect(res => {
          if(res.body.name !== 'david') throw new Error('not found')
        })
        .end(done);
    });

    it('Should get one', (done) => {
      agent
        .get('/api/mailer/' + newMailerId)
        .expect(200)
        .expect(res => {
          if(res.body.name !== 'joe') throw new Error('not found')
        })
        .end(done);
    });

    it('Should update', (done) => {
      agent
        .put('/api/mailer/' + newMailerId)
        .send({name: 'david'})
        .expect(200)
        .expect(res => {
          if(res.body.name !== 'david') throw new Error('not found')
        })
        .end(done);
    });

    it('Should delete', (done) => {
      agent
        .delete('/api/mailer/' + newMailerId)
        .expect(200)
        .expect(res => {
          console.log()
          if(res.body.name !== 'joe') throw new Error('not found')
        })
        .expect(()=>{
          return Mailer.find({})
            .then(mailer => {
              if(mailer.length) throw new Error('did not delete')
            });
        })
        .end(done);
    });

  });
});