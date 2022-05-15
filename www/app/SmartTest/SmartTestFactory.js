'use strict';

angular.module('smartStudentApp').factory('SmartTestFactory', function($q, $http, LoginFactory) {
    var factory = {};

    var URL = LoginFactory.getBaseUrl() + '/secure';

    factory.getAllQuestionsForTest = function(testId) {
        var d = $q.defer();
        $http({
            method: 'GET',
            url: URL + '/getQuestionsForTest/' + testId
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

    factory.getResultsForQuestion = function(questionId, studentId) {
        var d = $q.defer();
        $http({
            method: 'GET',
            url: URL + '/getResultsForQuestion/' + questionId + '/' + studentId
        }).then(function(success) {
            d.resolve(success);
        }, function(error) {
            d.reject(error);
        });
        return d.promise;
    };

    factory.studentAnswersQuestion = function(answer) {
        var d = $q.defer();
        $http({
            method: 'POST',
            url: URL + '/studentAnswersQuestion',
            data: answer,
            headers: {
                'Content-Type': 'application/json'
            }
        }).then(function(success) {
            d.resolve(success);
        }, function(error) {
            d.reject(error);
        });
        return d.promise;
    };

    factory.studentReportsQuestion = function(answer) {
        var d = $q.defer();
        $http({
            method: 'POST',
            url: URL + '/studentReportsQuestion',
            data: answer,
            headers: {
                'Content-Type': 'application/json'
            }
        }).then(function(success) {
            d.resolve(success);
        }, function(error) {
            d.reject(error);
        });
        return d.promise;
    };

    return factory;
});