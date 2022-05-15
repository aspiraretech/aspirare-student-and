'use strict';

angular.module('smartStudentApp').factory('AssignmentFactory', function($q, $http, LoginFactory) {
    var factory = {
        selectedAssignment: null
    };

    var URL = LoginFactory.getBaseUrl() + '/secure';

    factory.getAllAssignments = function(classId, studentId, year) {
        var d = $q.defer();
        $http({
            method: 'GET',
            url: URL + '/assignment/getAllByClassAndStudent/' + classId + '/' + studentId + '/' + year
        }).then(function(success) {
            d.resolve(success);
        }, function(error) {
            d.reject(error);
        });
        return d.promise;
    };

    factory.getAssignmentImages = function(assignmentId) {
        var d = $q.defer();
        $http({
            method: 'GET',
            url: URL + '/assignment/getImages/' + assignmentId
        }).then(function(success) {
            d.resolve(success);
        }, function(error) {
            d.reject(error);
        });
        return d.promise;
    };

    return factory;
});