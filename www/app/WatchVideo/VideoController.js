'use strict';
angular.module('smartStudentApp')
    .controller('VideoController', function($scope, TopicDetailsFactory, $sce) {
        $scope.selectedVideo = $sce.trustAsResourceUrl(TopicDetailsFactory.selectedVideo);
    });