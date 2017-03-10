// Nodemailer
// import url
// import nodemailer from "nodemailer"
// import moment

import config from '../../config/config';
import * as gmail from './mailer.gmail.com'



export const send = function(details, callback) {
	gmail.sendMessage(details, callback);
}

export const inbox = function(details, callback){
    console.log("postman ready to read your mails.");
    gmail.fetchMessages(details, callback);
}

export const readMessage = function(details, callback){
    console.log("postman ready to read mail.");
    gmail.readMessage(details, callback);
}

export const modify = function(details, callback){
    console.log("postman ready to update mail.");
    gmail.modifyLabel(details, callback);
}

export const trash = function(details, callback){
	console.log("postman ready to delete mail.");
    gmail.deleteMessage(details, callback);	
}

export const fetchCount = function(details, callback){
	console.log("postman ready to fetch counts.");
    gmail.fetchCount(details, callback);	
}


// export const drafts = function(details, callback){
//     console.log("postman ready to read your mails.");
//     gmail.fetchMessages(callback)
// }

// export const sent = function(details, callback){
//     console.log("postman ready to read your mails.");
//     gmail.fetchMessages(callback)
// }

// export const important = function(details, callback){
//     console.log("postman ready to read your mails.");
//     gmail.fetchMessages(callback)
// }

// export const trash = function(details, callback){
//     console.log("postman ready to read your mails.");
//     gmail.fetchMessages(callback)
// }