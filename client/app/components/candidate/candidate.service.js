
const HTTP = new WeakMap();

class candidateService {

    constructor($http) {
        HTTP.set(this, $http);
    }

    getJobsDetail(userId, flag, status) {
        return HTTP.get(this).get(`/api/jobs/getJobsDetail/${userId}/${flag}/${status}`).then(result => result.data );
    }
    getAllInternalDataCandidateList(skip) {
        return HTTP.get(this).get(`/api/candidate/allInternalDataCandidateList/${skip}`).then(result => result.data );
    }
    moveToActiveJob(requestData) {
        return HTTP.get(this).post("/api/jobs/moveToActiveJob", requestData).then(result => result.data);
    }
    getCandidateDetails(candidateId) {
        return HTTP.get(this).get(`/api/jobs/candidateDetails/${candidateId}`).then(result => result.data);
    }
    uploadResumeFile(fd) {
        return HTTP.get(this).post("/api/jobs/uploadResume", fd, {
                transformRequest: angular.identity,
                headers: {'Content-Type': undefined}
            }).then(result => result.data);
    }
    getLinkedInLink(candidateId) {
        return HTTP.get(this).get(`/api/jobs/linkedinLink/${candidateId}`).then(result => result.data );
    }
    getResumeMetadata(candidateId) {
        return HTTP.get(this).get(`/api/jobs/getResumeMetadata/${candidateId}`).then(result => result.data);
    }
    saveCandidateDetails(formData) {
        return HTTP.get(this).post("/api/jobs/updateCandidateDetails", formData).then(result => result.data);
    }
    feedJobData(candidateId) {
        return HTTP.get(this).get(`/api/jobs/feedJobData/${candidateId}`).then(result => result.data);
    }
    sendMessage(formData) {
        return HTTP.get(this).post("/api/jobs/savePostMessage", formData).then(result => result.data);
    }
    feedMsgThreadData(jobId,candidateId) {
        return HTTP.get(this).get(`/api/jobs/getFeedThread/${jobId}/${candidateId}`).then(result => result.data);
    }

    static getInstance($http){
        return new candidateService($http);
    }

    // Mailer service
    fetchMails(data){
        var url = "/api/mailer?label="+data.label;
        if(data.searchText){
            url += "&query="+data.searchText;
        }
        if(data.token){
            url += "&token="+data.token
        }
        console.log(url)
        return HTTP.get(this).get(url).then(result => result.data);
    }

    modifyEmail(id, action, label){
        return HTTP.get(this).post("/api/mailer/modify", {
            id:id,
            addLabels: action ? [label] : [],
            removeLabels: action?[]:[label]
        }).then(result => result.data);;
    }
    fetchMailCount(){
        return HTTP.get(this).get("/api/mailer/counter").then(result => result.data);
    }

    composeMail(params){
        return HTTP.get(this).post("/api/mailer", params).then(result => result.data);
    }

    readMail(message){
        return HTTP.get(this).get("/api/mailer/"+message.id).then(result => result.data);
    }
}

candidateService.getInstance.$inject = ['$http'];

export default candidateService;