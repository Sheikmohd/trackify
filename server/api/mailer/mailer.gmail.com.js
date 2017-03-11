import google from 'googleapis';
import googleAuth from 'google-auth-library';
import async from 'async';
import path from 'path';
import fs from 'fs';
import mailparser from 'mailparser'
const simpleParser = mailparser.simpleParser

var labels = ["INBOX", "IMPORTANT", "DRAFT"]
var upload_path = 'C:\\Users\\VIMO\\Documents\\GitHub\\trackify\\dist\\util\\resume_files'
const gmail = google.gmail('v1');
// Temporary data, This must come from auth module.
var credentials = { "web": { "client_id": "907704178698-cahcjcicbnkspv5m70qksticpbc5lp1v.apps.googleusercontent.com", "project_id": "tidy-jetty-160504", "auth_uri": "https://accounts.google.com/o/oauth2/auth", "token_uri": "https://accounts.google.com/o/oauth2/token", "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs", "client_secret": "d5ziyoDZPkifltaOIRwfBNwV", "redirect_uris": ["http://tarunsoni.com", "http://localhost.com"], "javascript_origins": ["http://tarunsoni.com", "http://localhost.com"] } }
var access_token = {"access_token":"ya29.GlsLBGmgC1atH-DNkqgAEd-v0XwZsI_xPkixA0Ec3omLM0zeQ_LTk-pGfj_f721xmfD7Te6kH8GzL-qx0l-4MI31mRSZ7hEnhvGrJ2cQLcPyUMOJMZH9vXvuY3y-","refresh_token":"1/A_i-oOHiKV3rg3YL1ztHzykpSZp2xtL32qQuawcEbH2Zk97WkV9vev-w7n0acwGS","token_type":"Bearer","expiry_date":1489207054167}
// var access_token = {"access_token":"ya29.GlsGBO5xVLJm4ZrpKksJIR86HQK8vX_mSKNRW8fMmBGVncVoLsloz9idAumW1M6G181NBg5LYh77ALXCD8tAv0J7nF7lHyphUQW7pIqVHAfWHfYd3BJiMWcp2oQh","refresh_token":"1/1qjbgZ3M_QtzdP0Fb6-LAXgQjd0tyuSNka9VT-DnPlA","token_type":"Bearer","expiry_date":1488804234044}
function authorize(callback) {
    var clientSecret = credentials.web.client_secret;
    var clientId = credentials.web.client_id;
    var redirectUrl = credentials.web.redirect_uris[0];
    var auth = new googleAuth();
    var oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);
    oauth2Client.credentials = access_token;
    callback(oauth2Client);
}


export const fetchMessages = function(request, callback) {

    async.waterfall([authorizeUser, listMails, readMails], function(error, response) {
        if (error) {
            callback(error);
        } else {
            callback(response);
        }
    });

    function authorizeUser(callback) {
        console.log("authorize")
        authorize(function(auth) {
            console.log("got the authorized")
            callback(null, auth);
        })
    }

    function listMails(auth, callback) {
        console.log("gonna read inbox.")
        var params = {
            auth: auth,
            userId: 'me',
            labelIds: request.label,
            maxResults: 20
        }
        if(request.token){
            params.pageToken = request.token;
        }
        // -from:flipkart.com -from:myntra.com -from:magicbricks.com -from:github.com -from:olacabs.com 
        if(request.label == "candidate"){
            params.labelIds = "INBOX"
            params.q = "-from:flipkart.com -from:myntra.com -from:olacabs.com"
        }
        if(request.label == "client"){
            params.labelIds = "INBOX"
            params.q = "{from:google.com}"
        }
        if(request.label == "search"){
            delete params.labelIds;
            params.q = request.query
        }
        gmail.users.messages.list(params, function(err, response) {
            if (err) {
                callback(err);
            } else {
                console.log(response.nextPageToken);
                callback(null, auth, response);
            }
        });
    }

    function readMails(auth, response, callback) {
        var messages = [];
        async.each(response.messages, function iterate(message, next) {
            gmail.users.messages.get({
                auth: auth,
                userId: 'me',
                format: "metadata",
                id: message.id,
                metadataHeaders: ['From', 'Subject', 'Date', 'To', 'Content-Type']
            }, function(err, response) {
                if (err) {
                    next({ status: 500, msg: "Error retriving messages." })
                } else {
                    console.log(JSON.stringify(response, null, 2))
                    var _message = { id: message.id, threadId: message.threadId, hasAttachment:false, isStarred:false, isRead:true };
                    if(response.labelIds.indexOf("STARRED") != -1){
                        _message.isStarred = true;
                    }
                    if(response.labelIds.indexOf("UNREAD") != -1){
                        _message.isRead = false;
                    }
                    for (var header of response.payload.headers) {
                        if(header.name == "Content-Type" && header.value.indexOf("multipart/mixed") != -1){
                            _message.hasAttachment = true;   
                        }else{
                            _message[header.name.toLowerCase()] = header.value;
                        }
                    }
                    if(_message.subject == ""){
                        _message.subject = "(No Subject)" + response.snippet.substr(0,25)
                    }else{
                        _message.subject += "     " + response.snippet.substr(0,25)
                    }
                    messages.push(_message)
                    next();
                }
            });
        }, function done(err) {
            callback(null, {status:200, messages:messages, nextPageToken:response.nextPageToken});
        })
    }
}

export const sendMessage = function(request, callback) {
    async.waterfall([authorizeUser, createMessage, _sendMessage], function(error, response) {
        if (error) {
            callback(error);
        } else {
            callback({ status: 200 });
        }
    });

    function authorizeUser(callback) {
        authorize(function(auth) {
            callback(null, { auth: auth });
        })
    }

    function createMessage(data, callback) {
        console.log("creat mimeMessage");
        createMimeMessage_(request, function(msg) {
            console.log(msg);
            data.mimeMessage = msg;
            callback(null, data)
        });

    }

    function _sendMessage(data, callback) {
        gmail.users.messages.send({
            auth: data.auth,
            userId: 'me',
            resource: {
                raw: data.mimeMessage
            }
        }, function(error, response) {
            if (error) {
                callback({ status: 500 });
            } else {
                callback();
            }
        });
    }
}

export const readMessage = function(request, callback) {
    async.waterfall([authorizeUser, _readMessage], function(error, response) {
        if (error) {
            callback(error);
        } else {
            callback({ status: 200 , msg:response});
        }
    });

    function authorizeUser(callback) {
        authorize(function(auth) {
            callback(null, { auth: auth });
        })
    }

    function _readMessage(data, callback){
        gmail.users.messages.get({
            auth: data.auth,
            userId: 'me',
            id: request.params.id,
            format:'raw'
        }, function(error, response) {
            if (error) {
                callback({ status: 500 });
            } else {
                console.log(JSON.stringify(response))
                simpleParser(new Buffer(response.raw, 'base64').toString(), (err, mail)=>{callback(null, mail)})
            }
        });
    }
}

export const modifyLabel = function(req, callback){
    console.log(req);
    async.waterfall([authorizeUser, updateMessage], function(error, response) {
        if (error) {
            callback(error);
        } else {
            callback({ status: 200 , msg:response});
        }
    });


    function authorizeUser(callback) {
        authorize(function(auth) {
            callback(null, { auth: auth });
        })
    }

    function updateMessage(data, callback){
        async.each(req.id, function iterator(id, callback){
            var params = {
                auth: data.auth,
                userId: 'me',
                id: id,
                resource:{}
            }
            if(req.addLabels && req.addLabels.length > 0){
                params.resource.addLabelIds = req.addLabels
            }
            if(req.removeLabels && req.removeLabels.length > 0){
                params.resource.removeLabelIds = req.removeLabels
            }
            console.log(params)
            gmail.users.messages.modify(params, function(error, response) {
                callback();
            });
        }, function done(error){
            if (error) {
                console.log(error);
                callback({ status: 500 });
            } else {
                callback(null, {status:200});
            }
        });
        
    }
}

export const deleteMessage = function(request, callback){
    async.waterfall([authorizeUser, trashMessage], function(error, response) {
        if (error) {
            callback(error);
        } else {
            callback({ status: 200 , msg:response, id:request.params.id});
        }
    });


    function authorizeUser(callback) {
        authorize(function(auth) {
            callback(null, { auth: auth });
        })
    }
    
    function trashMessage(data, callback){
        gmail.users.messages.trash( {
            auth: data.auth,
            userId: 'me',
            id: request.params.id
        }, function(error, response) {
            if (error) {
                console.log(error);
                callback({ status: 500 });
            } else {
                callback(null, {status:200});
            }
        });
    }
}

export const restoreMessage = function(request, callback){
    async.waterfall([authorizeUser, untrashMessage], function(error, response) {
        if (error) {
            callback(error);
        } else {
            callback({ status: 200 , msg:response});
        }
    });


    function authorizeUser(callback) {
        authorize(function(auth) {
            callback(null, { auth: auth });
        })
    }
    
    function untrashMessage(data, callback){
        gmail.users.messages.untrash( {
            auth: data.auth,
            userId: 'me',
            id: request.params.id
        }, function(error, response) {
            if (error) {
                console.log(error);
                callback({ status: 500 });
            } else {
                callback(null, {status:200});
            }
        });
    }
}

export const fetchCount = function(requset, callback){
    async.waterfall([authorizeUser, _fetchCount], function(error, response) {
        if (error) {
            callback(error);
        } else {
            callback({ status: 200 , data:response});
        }
    });

    function authorizeUser(callback) {
        authorize(function(auth) {
            callback(null, { auth: auth });
        })
    }

    function _fetchCount(data, callback){
        var counter = {}
        async.each(labels, function iterator(label, callback){
            gmail.users.labels.get({
                auth: data.auth,
                userId: 'me',
                id: label
            }, function(error, response){
                counter[label] = response;
                callback()
            });
        }, function done(){
            callback(null, counter)
        });
    }
}

function createMimeMessage_(msg, callback) {
    var nl = "\n";
    var boundary = "--4sa5re-4se5re4-34e3424";

    var mimeBody = [
        "MIME-Version: 1.0",
        "To: " + "First Last name" + "<" + msg.mailTo + ">",
        "From: " + "Anzy Careers" + "<" + msg.mailFrom + ">",
        "Subject: " + msg.subject,
        "Content-Type: multipart/mixed; boundary=" + boundary + nl,
        "--" + boundary,
        "Content-Type: text/html; charset=UTF-8",
        "Content-Transfer-Encoding: base64",
        msg.body.toString('base64') + nl
    ];
    if (msg.attachments) {
        async.eachSeries(msg.attachments, function iterator(attachment, nexxt) {
            fs.readFile(upload_path + "\\" + attachment.fileName, function(err, fileBytes) {
                if (err) {
                    console.log(err);
                } else {
                    mimeBody.push("--" + boundary);
                    mimeBody.push("Content-Type: " + attachment.mimetype + "; name=" + attachment.originalFileName + "");
                    mimeBody.push("Content-Disposition: attachment;");
                    mimeBody.push("Content-Transfer-Encoding: base64" + nl);
                    mimeBody.push(fileBytes.toString('base64'))
                }
                nexxt();
            });
        }, function done() {
            mimeBody.push("--" + boundary + "--");
            callback(base64Encode(mimeBody.join(nl)));
        });
    } else {
        mimeBody.push("--" + boundary + "--");
        callback(base64Encode(mimeBody.join(nl)));
    }
}

function base64Encode(msg) {
    return new Buffer(msg).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
