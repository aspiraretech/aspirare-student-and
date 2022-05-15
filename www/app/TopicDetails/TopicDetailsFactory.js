'use strict';

angular.module('smartStudentApp').factory('TopicDetailsFactory', function($q, $http, LoginFactory) {
    var factory = {
        defaultPresentationURL: null,
        presentationURL: null,
        subTopics: null,
        selectedVideo: null
    };

    var URL = LoginFactory.getBaseUrl() + '/secure';

    factory.getTopicPresentationURL = function(topicId, collegeId, classId) {
        var d = $q.defer();
        $http({
            method: 'GET',
            url: URL + '/getTopicPresentationURL/' + topicId + '/' + collegeId + '/' + classId
        }).then(function(success) {
            factory.presentationURL = success.data.Data;
            d.resolve(success);
        }, function(error) {
            d.reject(error);
        });
        return d.promise;
    };

    factory.getTopicDefaultPresentationURL = function(chapterId, topicId) {
        var d = $q.defer();
        $http({
            method: 'GET',
            url: URL + '/getTopicDefaultPresentation/' + chapterId + '/' + topicId
        }).then(function(success) {
            factory.defaultPresentationURL = success.data.Data;
            d.resolve(success);
        }, function(error) {
            d.reject(error);
        });
        return d.promise;
    };

    factory.getStudentLikeStatus = function(studentId, topicId) {
        var d = $q.defer();
        $http({
            method: 'GET',
            url: URL + '/getStudentLikeStatus/' + studentId + '/' + topicId
        }).then(function(success) {
            d.resolve(success);
        }, function(error) {
            d.reject(error);
        });
        return d.promise;
    };

    factory.getLikeStats = function(topicId) {
        var d = $q.defer();
        $http({
            method: 'GET',
            url: URL + '/getLikeStatsForTopic/' + topicId
        }).then(function(success) {
            factory.defaultPresentationURL = success.data.Data;
            d.resolve(success);
        }, function(error) {
            d.reject(error);
        });
        return d.promise;
    };

    factory.getQuestionCountForTopic = function(topicId) {
        var d = $q.defer();
        $http({
            method: 'GET',
            url: URL + '/getQuestionCountForTopic/' + topicId
        }).then(function(success) {
            d.resolve(success);
        }, function(error) {
            d.reject(error);
        });
        return d.promise;
    };

    factory.getAllSubTopics = function(topicIds) {
        var d = $q.defer();
        $http({
            method: 'POST',
            url: URL + '/getAllSubTopics',
            data: topicIds,
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

    factory.likeTopic = function(obj) {
        var d = $q.defer();
        $http({
            method: 'POST',
            url: URL + '/studentLikesTopic',
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

    factory.getStudentRatingForTopic = function(obj) {
        var d = $q.defer();
        $http({
            method: 'POST',
            url: URL + '/getStudentRatingForTopic',
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