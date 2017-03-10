module.exports = {
  logging: false,
  appHostName: "http://localhost:9000",
  db: {
    url: 'mongodb://localhost/trackify-test'
  },
  mysqldb: {
    host     : 'localhost',
    user     : 'root',
    password : 'root123',
    database : 'trackify'
  },
  mailer:{
    service: "gmail",
    host: "smtp.gmail.com",
    username:"team.lightbulbmoments",
    password:"lightbulbmoments"
  }
};