
const HTTP = new WeakMap();

class jobsService {

    constructor($http) {
        HTTP.set(this, $http);
    }

    getJobsDetail(userId, flag, status) {
        return HTTP.get(this).get(`/api/jobs/getJobsDetail/${userId}/${flag}/${status}`).then(result => result.data );
    }
    candidateDetailsForJob(userId, jobId, filter, filterFrom) {
        let reqObj = {userId, jobId, filter, filterFrom};
        return HTTP.get(this).post("/api/jobs/candidateDetailsForJob", reqObj).then(result => result.data);
    }

    getResumeMetadata(candidateId) {
        return HTTP.get(this).get(`/api/jobs/getResumeMetadata/${candidateId}`).then(result => result.data);
    }

    uploadResumeFile(fd) {
        return HTTP.get(this).post("/api/jobs/uploadResume", fd, {
                transformRequest: angular.identity,
                headers: {'Content-Type': undefined}
            }).then(result => result.data);
    }

    uploadNewCandidateResumeFile(fd) {
        return HTTP.get(this).post("/api/jobs/uploadNewCandidateResume", fd, {
                transformRequest: angular.identity,
                headers: {'Content-Type': undefined}
            }).then(result => result.data);
    }

    moveToNextStage(requestData) {
        return HTTP.get(this).post("/api/jobs/moveToNextStage", requestData).then(result => result.data);
    }

    moveJobToInactive(requestData) {
        return HTTP.get(this).post("/api/jobs/moveToInactiveJob", requestData).then(result => result.data);
    }

    changeStatus(requestData) {
        return HTTP.get(this).post("/api/jobs/changeStatus", requestData).then(result => result.data);
    }
    getCandidateDetails(candidateId) {
        return HTTP.get(this).get(`/api/jobs/candidateDetails/${candidateId}`).then(result => result.data);
    }

    getSimilarJobsData(reqData){
        return HTTP.get(this).post("/api/jobs/getSimilarJobs", reqData).then(result => result.data);
    }

    feedMsgThreadData(jobId,candidateId) {
        return HTTP.get(this).get(`/api/jobs/getFeedThread/${jobId}/${candidateId}`).then(result => result.data);
    }

    feedJobData(candidateId) {
        return HTTP.get(this).get(`/api/jobs/feedJobData/${candidateId}`).then(result => result.data);
    }

    saveCandidateDetails(formData) {
        return HTTP.get(this).post("/api/jobs/updateCandidateDetails", formData).then(result => result.data);
    }

    sendMessage(formData) {
        return HTTP.get(this).post("/api/jobs/savePostMessage", formData).then(result => result.data);
    }

    addInterviewDate(reqData) {
        return HTTP.get(this).post("/api/jobs/addInterviewDate", reqData).then(result => result.data);
    }

    getAllRecruiters() {
        return HTTP.get(this).get('/api/jobs/allRecruiters').then(result => result.data );
    }

    getLinkedInLink(candidateId) {
        return HTTP.get(this).get(`/api/jobs/linkedinLink/${candidateId}`).then(result => result.data );
    }
    // internalDataCount(jobId) {
    //     return HTTP.get(this).get(`/api/jobs/internalDataCount/${jobId}`).then(result => result.data );
    // }
    // socialDataCount(jobId) {
    //     return HTTP.get(this).get(`/api/jobs/socialDataCount/${jobId}`).then(result => result.data );
    // }
    // socialDataInJob(reqData) {
    //     return HTTP.get(this).post('/api/jobs/socialData', reqData).then(result => result.data );
    // }

    static getInstance($http){
        return new jobsService($http);
    }
}

jobsService.getInstance.$inject = ['$http'];

export default jobsService;