'use strict';

angular.module('smartStudentApp').factory('SmartLearningFactory', function($q, $http, LoginFactory) {
    var factory = {};

    var URL = LoginFactory.getBaseUrl() + '/secure';

    factory.getAllQuestionsForTopic = function(topicId, isSmartLearning) {
        var d = $q.defer();
        $http({
            method: 'GET',
            url: URL + '/getQuestionsForTopic/' + topicId + '/' + isSmartLearning
        }).then(function(success) {
            d.resolve(success);
        }, function(error) {
            d.reject(error);
        });
        return d.promise;
    };

    factory.getAllOptionsForQuestion = function(questionId, packageCode) {
        var d = $q.defer();
        $http({
            method: 'GET',
            url: URL + '/getOptionsForQuestion/' + questionId + '/' + packageCode
        }).then(function(success) {
            d.resolve(success);
        }, function(error) {
            d.reject(error);
        });
        return d.promise;
    };

    return factory;
});