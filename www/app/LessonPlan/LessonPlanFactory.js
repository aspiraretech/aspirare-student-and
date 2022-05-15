'use strict';

angular.module('smartStudentApp').factory('LessonPlanFactory', function($q, $http, LoginFactory) {
    var factory = {
        selectedTopic: null,
        selectedChapter: null,
        selectedChapterIndex: null
    };

    var URL = LoginFactory.getBaseUrl() + '/secure';

    factory.getLessonPlan = function(obj) {
        var d = $q.defer();
        $http({
            method: 'POST',
            url: URL + '/getLessonPlan',
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