'use strict';

angular.module('smartStudentApp').factory('StudentDetailsFactory', function($q, $http, LoginFactory) {
    var factory = {};
    var URL = LoginFactory.getBaseUrl() + '/secure';

    factory.getStudentDetails = function(studentId) {
        var d = $q.defer();
        $http({
            method: 'GET',
            url: URL + '/student/getById/' + studentId
        }).then(function(success) {
            d.resolve(success);
        }, function(error) {
            d.reject(error);
        });
        return d.promise;
    };

    factory.getBalanceFeesforStudent = function(obj) {
        var d = $q.defer();
        $http({
            method: 'POST',
            url: URL + '/getBalanceFeesforStudent',
            data: obj,
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

    factory.setTrialStartDate = function(obj) {
        var d = $q.defer();
        $http({
            method: 'POST',
            url: URL + '/setTrialStartDate',
            data: obj,
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

    factory.getBorrowedBooks = function(studentId) {
        var d = $q.defer();
        $http({
            method: 'GET',
            url: URL + '/getAllBooksByStudent/' + studentId
        }).then(function(success) {
            d.resolve(success);
        }, function(error) {
            d.reject(error);
        });
        return d.promise;
    };

    return factory;
});