import angular from 'angular';
import uiRouter from 'angular-ui-router';
import candidateComponent from './candidate.component';
import service from './candidate.service';
import shareData from '../jobs/jobs.service.data'
import trustAsResourceUrlFilter from './candidate.filter';

let candidateModule = angular.module('candidate', [
  uiRouter
])

.config(($stateProvider, $urlRouterProvider) => {
  "ngInject";

  $urlRouterProvider.otherwise('/');

  $stateProvider
    .state('candidate', {
      url: '/candidate',
      template: '<candidate user="vm.auth.user"></candidate>'
    });
})
.component('candidate', candidateComponent)
.factory('candidateService', service.getInstance)
.service('shareData', shareData)
.filter('trustAsResourceUrl', trustAsResourceUrlFilter);

export default candidateModule;
