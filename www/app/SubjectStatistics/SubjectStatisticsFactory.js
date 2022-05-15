'use strict';

angular.module('smartStudentApp').factory('SubjectStatisticsFactory', function($q, $http, LoginFactory) {
    var factory = {
        selected: {
            subject: null
        }
    };
    var URL = LoginFactory.getBaseUrl() + '/secure';

    factory.getAllSubjects = function(courseId, branchId, semesterId, studentId) {
        var d = $q.defer();
        $http({
            method: 'GET',
            url: URL + '/subject/getAllBySemesterAndStudent/' + courseId + '/' + branchId + '/' + semesterId + '/' + studentId
        }).then(function(success) {
            d.resolve(success);
        }, function(error) {
            d.reject(error);
        });
        return d.promise;
    };

    factory.getAllSubjectsWithUserId = function(courseId, branchId, semesterId) {
        var d = $q.defer();
        $http({
            method: 'GET',
            url: URL + '/subject/getAllBySemesterWithUserId/' + courseId + '/' + branchId + '/' + semesterId
        }).then(function(success) {
            d.resolve(success);
        }, function(error) {
            d.reject(error);
        });
        return d.promise;
    };

    factory.getMarksStatistics = function(subjectId, classId, studentId) {
        var d = $q.defer();
        $http({
            method: 'GET',
            url: URL + '/getStudentMarksStatistics/' + subjectId + '/' + classId + '/' + studentId
        }).then(function(success) {
            d.resolve(success);
        }, function(error) {
            d.reject(error);
        });
        return d.promise;
    };

    factory.getAttendanceStatistics = function(subjectId, studentId) {
        var d = $q.defer();
        $http({
            method: 'GET',
            url: URL + '/getStudentAttendanceStatistics/' + subjectId + '/' + studentId
        }).then(function(success) {
            d.resolve(success);
        }, function(error) {
            d.reject(error);
        });
        return d.promise;
    };

    factory.getAllAttendance = function(studentId, subjectId) {
        var d = $q.defer();
        $http({
            method: 'GET',
            url: URL + '/attendance/getAllByStudent/' + studentId + '/' + subjectId
        }).then(function(success) {
            d.resolve(success);
        }, function(error) {
            factory.isAuthenticated = false;
            d.reject(error);
        });
        return d.promise;
    };


    return factory;
});