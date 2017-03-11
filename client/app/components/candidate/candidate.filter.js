
let trustAsResourceUrlFilter = function($sce) {
    return function(val) {
        return $sce.trustAsResourceUrl(val);
    };
};

trustAsResourceUrlFilter.$inject = ['$sce'];

export default trustAsResourceUrlFilter;
