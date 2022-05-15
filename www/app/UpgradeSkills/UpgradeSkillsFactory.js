'use strict';

angular.module('smartStudentApp').factory('UpgradeSkillsFactory', function($q, $http, LoginFactory) {
    var factory = {};

    var URL = LoginFactory.getBaseUrl() + '/secure';

    factory.getQuestionsForSkill = function(obj) {
        var d = $q.defer();
        $http({
            method: 'POST',
            url: URL + '/getQuestionsForSkill',
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

    factory.getQuizzesForSkill = function(obj) {
        var d = $q.defer();
        $http({
            method: 'POST',
            url: URL + '/getQuizzesForSkill',
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

    return factory;
});