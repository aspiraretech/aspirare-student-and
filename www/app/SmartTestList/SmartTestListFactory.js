'use strict';

angular.module('smartStudentApp').factory('SmartTestListFactory', function($q, $http, LoginFactory) {
    var factory = {
        selectedTest: null,
        selectedSlide: 0,
        selectedTopic: null,
        selectedChapterIndex: null
    };

    var URL = LoginFactory.getBaseUrl() + '/secure';

    factory.getAllSmartTestsForStudent = function(branchId, subjectId, studentId, type) {
        var d = $q.defer();
        $http({
            method: 'GET',
            url: URL + '/getAllSmartTestsForStudent/' + branchId + '/' + subjectId + '/' + studentId + '/' + type
        }).then(function(success) {
            d.resolve(success);
        }, function(error) {
            d.reject(error);
        });
        return d.promise;
    };

    factory.getCompletedTopics = function(studentId, subjectId) {
        var d = $q.defer();
        $http({
            method: 'GET',
            url: URL + '/getTopicsForStudent/' + studentId + '/' + subjectId
        }).then(function(success) {
            d.resolve(success);
        }, function(error) {
            d.reject(error);
        });
        return d.promise;
    };

    factory.getAllTopicsForSmartTest = function(smartTestId) {
        var d = $q.defer();
        $http({
            method: 'GET',
            url: URL + '/getAllTopicsForSmartTest/' + smartTestId
        }).then(function(success) {
            d.resolve(success);
        }, function(error) {
            d.reject(error);
        });
        return d.promise;
    };

    factory.getSmartTestMetrics = function(studentId, smartTestId) {
        var d = $q.defer();
        $http({
            method: 'GET',
            url: URL + '/getSmartTestMetrics/' + studentId + '/' + smartTestId
        }).then(function(success) {
            d.resolve(success);
        }, function(error) {
            d.reject(error);
        });
        return d.promise;
    };

    return factory;
});