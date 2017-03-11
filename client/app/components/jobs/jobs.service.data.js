
let propertyShareBetweenController = function() {
    var property = 'blank';
    var jobVisitFlag = true;
    var dataPrsentFlag = false;
    return {
        getProperty: function () {
            return property;
        },
        setProperty: function(value) {
            property = value;
        },
        getJobVisitFlag: function() {
            return jobVisitFlag;
        },
        setJobVisitFlag: function() {
            jobVisitFlag = false;
        }
    };
};

export default propertyShareBetweenController;
