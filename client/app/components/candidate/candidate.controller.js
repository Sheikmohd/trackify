const SERVICE = new WeakMap();

class CandidateController {
  constructor($state, AuthFactory, candidateService, shareData) {
      this.userId = 1;
      this.idSkip = 0;
      this.checkIDCandidateList = [];
      this.flagCheckAllIDCandidate = false;
      this.sideMenuState = {flag: "myjob", status: "active"};
      this.$state = $state;
      this.shareData = shareData;
      
      SERVICE.set(this, candidateService);
  }

    checkAllIDCandidate(){
        this.checkIDCandidateList = [];
        for(let i=0; i<this.allCandidateDetails.length; i++){
                this.checkIDCandidateList.push(this.flagCheckAllIDCandidate);
            }
    }
    getSelectedIDCandidates() {
        this.checkedIDCandidateNum = 0;
        this.selectedIDCandidateIdArr = [];
        let leng = this.allCandidateDetails.length;
        for(let i=0; i<leng; i++){  
            if(this.checkIDCandidateList[i] === true){
                this.checkedIDCandidateNum++;
                this.selectedIDCandidateIdArr.push(this.allCandidateDetails[i].candidateId);
            }
        }
        if(this.checkedIDCandidateNum === 0){
            alert("Please select atleast one candidate from the list");
        }
    }
    uploadResume(candidateId){
        
        var file = this.resumeFile;
        if(file) {
            var fd = new FormData();
            fd.append('resumeFile', file);
            fd.append('candidateId', candidateId);
            fd.append('uploadDate', new Date());

            SERVICE.get(this).uploadResumeFile(fd).then(response => {
                console.log(response.message);
                if(response.message == "ERROR")
                    alert("Error occurred while uploading resume file.\nPlease select proper file type and size.");
                this.resumeFile = null;
                document.getElementById("new-file-input2").value="";
            }, error => {
                    console.log(error);
            });
        } else {
            alert("Please select a file to upload!");
            document.getElementById("new-file-input2").value="";
        }

    };
    saveIDCandidateDetails(candidateId) {
        
        if(document.getElementById("editreadonly_hidden").value == 0){
            if((this.iDataCandidateDetails.email.indexOf("@") == -1) 
                || (this.iDataCandidateDetails.email.indexOf(".") == -1 )
                || (this.iDataCandidateDetails.email.lastIndexOf(".") < this.iDataCandidateDetails.email.indexOf("@")) 
                || (this.iDataCandidateDetails.email.indexOf("@") != this.iDataCandidateDetails.email.lastIndexOf("@"))) {
                    alert("Please enter valid email address!");

                    $('#editreadonly').html("<i class='fa fa-floppy-o' aria-hidden='true'></i>");
                    $("#detailform :input").prop("disabled", false);
                    $("#editreadonly_hidden").val(1);
            }
            else if(this.iDataCandidateDetails.contact.length != 10){
                alert("Please enter 10 digit contact number");

                $('#editreadonly').html("<i class='fa fa-floppy-o' aria-hidden='true'></i>");
                $("#detailform :input").prop("disabled", false);
                $("#editreadonly_hidden").val(1);
            }
            else if((this.iDataCandidateDetails.candidateName != null) && (this.iDataCandidateDetails.email != null)
             && (this.iDataCandidateDetails.experience != null) && (this.iDataCandidateDetails.ctcFixed != null)
             && (this.iDataCandidateDetails.ctcVariable != null) && (this.iDataCandidateDetails.ctcEsops != null)
             && (this.iDataCandidateDetails.eCTCFixed != null) && (this.iDataCandidateDetails.eCTCVariable != null)
             && (this.iDataCandidateDetails.eCTCEsops != null)
             && (this.iDataCandidateDetails.location != null)) {

                let reqObject = Object.assign(this.iDataCandidateDetails);
                reqObject.candidateId = candidateId;

                SERVICE.get(this).saveCandidateDetails(reqObject).then(response => {
                    console.log(response.message);
                }, error => {
                    console.log(error);
                });
            } else {
                alert("Please enter required fields");
            }
        }
    };

    getFeedMsgThread(jobId, candidateId){
        this.feedMsgRecords = {};
        SERVICE.get(this).feedMsgThreadData(jobId, candidateId).then(response => {
            for(let i in response.TAGS){
                response.TAGS[i].sentTo = (response.TAGS[i].sentTo).split(",").join(" @");
            }
            this.feedMsgRecords = response;
        }, error => {
            console.log(error);
        });
    }
    internalDataCandidateDetailsFunction(candidateId) {

        SERVICE.get(this).getLinkedInLink(candidateId).then(response => {
            this.iDataLinkedInLink = response.linkedinLink;
        }, error => {
                console.log(error);
        });

        SERVICE.get(this).getResumeMetadata(candidateId).then(response => {
            this.iDataResumeFileMetadata = response;
        }, error => {
            console.log(error);
        });

        SERVICE.get(this).getCandidateDetails(candidateId).then(response => {
            this.iDataCandidateDetails = response;
            
        }, error => {
                console.log(error);
        });

        SERVICE.get(this).feedJobData(candidateId).then(response => {
            this.iDataFeedJobRecords = response;
        }, error => {
            console.log(error);
        });

    };
  getJobsDetail(userId, flag, status) {
        this.sideMenuState = {flag: flag, status: status};

        SERVICE.get(this).getJobsDetail(userId, flag, status).then(response => {
            this.sideMenuJobsDetails = response.data;
        }, error => {
            console.log(error);
        });

        SERVICE.get(this).getAllInternalDataCandidateList(this.idSkip).then(response => {
            this.allCandidateDetails = response.data;
            this.allCandidateCount = response.count;
            // Check candidate functionality
            this.flagCheckAllIDCandidate = false;
            this.checkIDCandidateList = [];
            for(let i=0; i<this.allCandidateDetails.length; i++){
                this.checkIDCandidateList.push(false);
            }
            //Get candidate Details section data
            if(this.allCandidateDetails.length > 0){
                this.internalDataCandidateDetailsFunction(this.allCandidateDetails[0].candidateId);
            }
        }, error => {
            console.log(error);
        });
    };
    skipRecall(evt){
        if(evt == '+'  && (this.idSkip+50) <= allCandidateCount){
            this.idSkip = this.idSkip+50;
            this.getJobsDetail(this.userId, this.sideMenuState.flag, this.sideMenuState.status);
        }
        if(evt == '-' && (this.idSkip-50) >= 0){
            this.idSkip = this.idSkip-50;
            this.getJobsDetail(this.userId, this.sideMenuState.flag, this.sideMenuState.status);
        }
    }
    initJobs() {
            $("#detailform :input").prop("disabled", true);
            this.getJobsDetail(this.userId, this.sideMenuState.flag, this.sideMenuState.status);
    };
    navToJobModule(jobId){
        let temp = {
            "jobId": jobId,
            "flag": this.sideMenuState.flag,
            "status": this.sideMenuState.status
        };  
        this.shareData.setProperty(temp);
        this.$state.go('jobs');
    }

    // Mail module starts here
    sendMessage(jobId, candidateId) {
        var reqData = {
            "jobId": jobId,
            "userId": this.userId,
            "candidateId": candidateId,
            "timestamp": new Date(),
            "message": this.postMessage
            };

        SERVICE.get(this).sendMessage(reqData).then(response => {
            this.postMessage = "";
            this.getFeedMsgThread(jobId, candidateId);
        }, error => {
            this.postMessage = "";
        });
    }

        fetchMails(label){
        $('.inboxtable').show();
        $('.openinbox').hide();
        if(!this.inbox.currentView){
            $("#mailslide").toggle("slide");
        }else if(this.inbox.currentView == label){
            // Same li is clicked twice, hide the menu
            $("#mailslide").toggle("slide");
            this.inbox.currentView = undefined;
            return;
        }
        this.inbox.currentView = label;
        SERVICE.get(this).fetchMails({label:label, query: this.searchText}).then(response=>{
            this.inbox[label] = [];
                console.log(this.inbox);
                // this.inbox.paginate[label].tokens = [undefined];
            // }
            this.inbox.paginate[label] = {};
            this.inbox[label] = response.messages;
            // this.inbox[label] = this.inbox[label].concat(response.messages);
            this.inbox.paginate[label].tokens = [,response.nextPageToken];
            console.log(this.inbox);
        }, error =>{
            console.log(error);
        });
    }

    composeMail(){
        console.log("We are composing mail");
        var params = {};
        params.mailTo = this.email.to;
        params.mailFrom = 'tarun1188@gmail.com';
        params.body = $('#mailtextarea').code();
        params.subject = this.email.subject;
        console.log(params);
        for(var key in params){
            if(!params[key]){
                alert("Missing " + key);
                break;
                return;
            }
        }
        SERVICE.get(this).composeMail(params).then(response=>{
            console.log(response);
        }, error =>{
            console.log(error);
        });
         
    }

    handleAttachments(){
        console.log(this.email.attachments);
        console.log("we are handling attachments")
    }

    fetchEmailTemplates(){
        console.log("fetch templates");
    }

    predictEmail(){
        console.log("predict ! predict !! predict !!!")
    }
    
    fetchMailCount(){
        SERVICE.get(this).fetchMailCount().then(response=>{
            this.inbox.inboxCounter = response.data.INBOX.messagesUnread;
            this.inbox.draftsCounter = response.data.DRAFT.messagesTotal;
            this.inbox.totalCounter = response.data.INBOX.messagesTotal
        }, error =>{
            console.log(error);
        });
    }

    modifyEmail(label, message){
        if(label == "STARRED"){
            SERVICE.get(this).modifyEmail([message.id], !message.isStarred, "STARRED").then(response=>{
                alert("Message updated.");
                message.isStarred=!message.isStarred;
            }, error =>{
                console.log(error);
            });
        }else{
            var idList = [];
            $('.mail-checkbox').each(function(){if(this.id && this.checked){idList.push(this.id)}});
            SERVICE.get(this).modifyEmail(idList, label== "UNREAD" ? false:true, label).then(response=>{
                alert("Message updated.")
                for (var k = idList.length - 1; k >= 0; k--) {
                    for (var i = this.inbox[label].length - 1; i >= 0; i--) {
                        if(label=="TRASH" && this.inbox[this.inbox.currentView][i].id == idList[k]){
                            this.inbox[this.inbox.currentView].splice(i,1);
                        }
                        if(label=="SPAM" && this.inbox[this.inbox.currentView][i].id == idList[k]){
                            this.inbox[this.inbox.currentView].splice(i,1);
                        }
                        if(label=="UNREAD" && this.inbox[this.inbox.currentView][i].id == idList[k]){
                            this.inbox[this.inbox.currentView][i].isRead = true;
                        }
                    }
                }
            }, error =>{
                console.log(error);
            });
        }
    }

    fetchNext(action){
        var label = this.inbox.currentView;
        if(!this.inbox.paginate[label].page){
            this.inbox.paginate[label].page=0;
        };
        if(action == "NEXT"){
            this.inbox.paginate[label].page += 1;
        }else{
            this.inbox.paginate[label].page -= 1;
        }
        var index = this.inbox.paginate[label].page;
        if(index == -1){
            return;
        }
        SERVICE.get(this).fetchMails({label:label,
            query:this.searchText,
            token:this.inbox.paginate[label].tokens[index]}).then(response=>{
            // this.inbox[label] = this.inbox[label].concat(response.messages);
            this.inbox[label] = response.messages;
            this.inbox.paginate[label].tokens.push(response.nextPageToken);
            console.log(this.inbox);
        }, error =>{
            console.log(error);
        });
    }

    readMail(message){
        this.inbox.message = message;
        $('.openinbox').show();
        $('.inboxtable').hide();
        SERVICE.get(this).readMail(message).then(response=>{
            console.log("------START----")
            console.log(response.msg);
            console.log("-----END-----")
            this.inbox.message.attachments = response.attachments;
            $('.email-body').html(response.msg.html);
            // this.email.content = response.msg.html;
        }, error =>{
            console.log(error);
        });
    }
}

CandidateController.$inject = ['$state', 'AuthFactory', 'candidateService', 'shareData']

export default CandidateController;
