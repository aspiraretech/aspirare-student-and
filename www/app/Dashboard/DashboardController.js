'use strict';
angular.module('smartStudentApp')
    .controller('DashboardController', function($scope, $state, ionicToast, LoginFactory, $ionicModal, $ionicPopup, $ionicSlideBoxDelegate, DashboardFactory, $rootScope, LearningReportFactory, $ionicPopover, NotificationsFactory, SubjectStatisticsFactory, EventsFactory, AssignmentFactory, LessonPlanFactory, $timeout, StudentDetailsFactory) {

        $scope.loggedInUser = LoginFactory.loggedInUser;
        $rootScope.$broadcast('userLoggedIn');
        $scope.students = LoginFactory.students;
        $scope.eventsAndAssignments = [];
        $scope.tests = [];
        $scope.barGraphSeries = [];
        $scope.tags = [];
        $scope.skillsToShow = [];
        $scope.skillsWithPerformance = [];
        $scope.todaysTopics = [];
        $scope.topicRating = [1, 2, 3, 4, 5];
        $scope.rating = {
            rate: 0,
            max: 5
        };

        // payment
        var payment = {
            key: "rzp_test_x3IFWffPHPhgYt",
            secret: "9w2vAFn2bbXq3q0vydl6ja61"
        };

        $scope.selected = {
            skill: null
        };

        NotificationsFactory.articleId = null;
        NotificationsFactory.selectedNotification = null;

        $scope.average = 0;
        $scope.attendanceStatistics = {};
        $scope.currentSubject = null;
        $scope.averageRating = 0;
        $scope.graph = {
            color: "#e33e2b"
        };
        $scope.keywords = [];
        $scope.options = {
            initialSlide: 0,
            onInit: function(swiper) {
                $scope.swiper = swiper;
            },
            onSlideChangeEnd: function(swiper) {
                DashboardFactory.selectedSlide = swiper.activeIndex;
                //swiper flag is 0 for swiping in same page. 1 for coming back from a different page
                if (DashboardFactory.swiperFlag == 1) {
                    DashboardFactory.swiperFlag = 0;
                }
                $scope.slideChanged(swiper.activeIndex);
            }
        };

        $ionicPopover.fromTemplateUrl('app/Dashboard/SelectStudentTemplate.html', {
            scope: $scope
        }).then(function(popover) {
            $scope.popover = popover;
        });
        $scope.openPopover = function($event) {
            $scope.popover.show($event);
        };
        $scope.closePopover = function() {
            $scope.popover.hide();
        };

        $ionicModal.fromTemplateUrl('app/Dashboard/AttendanceModal.html', {
            scope: $scope,
            animation: 'slide-in-up'
        }).then(function(modal) {
            $scope.attendanceModal = modal;
        });
        $scope.openAttendanceModal = function(subject) {
            $scope.attendanceModal.show();
            $scope.isAttendanceModalOpen = true;
            $scope.getAllAttendanceForStudent(subject);
        };
        $scope.closeAttendanceModal = function() {
            if ($scope.isAttendanceModalOpen) {
                $scope.attendanceModal.hide();
                $scope.isAttendanceModalOpen = false;
            }
        };

        $scope.getMarksStatistics = function() {
            var obj = {
                StudentId: $scope.loggedInUser.Id,
                ClassId: $scope.loggedInUser.ClassId
            };
            DashboardFactory.getAllSubjectStatsForStudent(obj)
                .then(function(success) {
                    if (success.data.Code != "S001") {
                        ionicToast.show(success.data.Message, 'bottom', false, 2500);
                    } else {
                        var avg_from_exam = (success.data.Data.AverageFromExam == null) ? 0 : success.data.Data.AverageFromExam;
                        var avg_from_test = (success.data.Data.AverageFromTest == null) ? 0 : success.data.Data.AverageFromTest;
                        var avg_from_quiz = (success.data.Data.AverageFromQuiz == null) ? 0 : success.data.Data.AverageFromQuiz;
                        $scope.average = DashboardFactory.calculateAverageWithWeightage(avg_from_test, avg_from_exam, avg_from_quiz);
                        if ($scope.average >= 75) {
                            $scope.graph.color = "#2ba14b";
                        } else if ($scope.average >= 50 && $scope.average < 75) {
                            $scope.graph.color = "#f1b500";
                        } else {
                            $scope.graph.color = "#e33e2b";
                        }
                        $scope.getAllSubjects();
                    }
                }, function(error) {
                    ionicToast.show(error, 'bottom', false, 2500);
                });
        };

        $scope.getAllSubjects = function() {
            $scope.subjects = [];
            DashboardFactory.getAllSubjects($scope.loggedInUser.CourseId, $scope.loggedInUser.BranchId, $scope.loggedInUser.SemesterId, $scope.loggedInUser.Id)
                .then(function(success) {
                    if (success.data.Code != "S001") {
                        ionicToast.show(success.data.Message, 'bottom', false, 2500);
                    } else {
                        $scope.subjects = success.data.Data;
                        if ($scope.loggedInUser.PackageCode == 'LM') {
                            $scope.getAllAttendanceStatistics();
                        } else if ($scope.loggedInUser.PackageCode == "EXTENDED") {
                            LearningReportFactory.saySubject = $scope.subjects[0];
                        } else {
                            $scope.getCurrentSubjectStats(DashboardFactory.selectedSlide);
                            $scope.getCurrentSubjectTopicsForToday(DashboardFactory.selectedSlide);
                            $timeout(function() {
                                $scope.swiper.slideTo(DashboardFactory.selectedSlide, 0);
                            }, 500);
                        }
                    }
                }, function(error) {
                    ionicToast.show(error, 'bottom', false, 2500);
                });
        };

        $scope.slideChanged = function(index) {
            if (index == 0) {
                if ($scope.loggedInUser.PackageCode == 'LM') {
                    $scope.getEventsAndAssignments();
                } else {
                    $scope.getCurrentSubjectStats(index);
                    $scope.getCurrentSubjectTopicsForToday(index);
                }
            } else {
                $scope.getCurrentSubjectStats(index);
                $scope.getCurrentSubjectTopicsForToday(index);
            }
        };

        $scope.getCurrentSubjectTopicsForToday = function(index) {
            var obj = {
                StudentId: LoginFactory.loggedInUser.Id,
                SubjectId: $scope.subjects[index].Id,
                ClassId: LoginFactory.loggedInUser.ClassId
            };
            DashboardFactory.getCurrentSubjectTopicsForToday(obj)
                .then(function(success) {
                    if (success.data.Code != "S001") {
                        ionicToast.show(success.data.Message, 'bottom', false, 2500);
                    } else {
                        var rows = success.data.Data;
                        $scope.chapters = [];
                        var flags = [];
                        for (var i = 0; i < rows.length; i++) {
                            if (flags[rows[i].ChapterId]) continue;
                            flags[rows[i].ChapterId] = true;
                            $scope.chapters.push({
                                Id: rows[i].ChapterId,
                                Name: rows[i].ChapterName
                            });
                        }
                        for (var j = 0; j < $scope.chapters.length; j++) {
                            $scope.chapters[j].Topics = [];
                            for (var k = 0; k < rows.length; k++) {
                                if ($scope.chapters[j].Id == rows[k].ChapterId) {
                                    $scope.chapters[j].Topics.push({
                                        Id: rows[k].TopicId,
                                        Name: rows[k].TopicName,
                                        Rating: rows[k].Rating
                                    });
                                }
                            }
                        }
                    }
                }, function(error) {
                    ionicToast.show(error, 'bottom', false, 2500);
                });
        };

        $scope.getCurrentSubjectStats = function(index) {
            if ($scope.loggedInUser.PackageCode == 'LM' && index == 1) {
                $scope.getAllSubjects();
            } else {
                $scope.marksStatistics = null;
                $scope.currentSubject = $scope.subjects[index];
                var obj = {
                    SubjectId: $scope.currentSubject.Id,
                    StudentId: $scope.loggedInUser.Id,
                    ClassId: $scope.loggedInUser.ClassId
                }

                if ($scope.loggedInUser.PackageCode == "SMART") {
                    $scope.getAllTags(obj);
                }

                DashboardFactory.getSubjectStatsForStudent(obj)
                    .then(function(success) {
                        if (success.data.Code != "S001") {
                            ionicToast.show(success.data.Message, 'bottom', false, 2500);
                        } else {
                            var avg_from_exam = (success.data.Data.AverageFromExam == null) ? 0 : success.data.Data.AverageFromExam;
                            var avg_from_test = (success.data.Data.AverageFromTest == null) ? 0 : success.data.Data.AverageFromTest;
                            var avg_from_quiz = (success.data.Data.AverageFromQuiz == null) ? 0 : success.data.Data.AverageFromQuiz;
                            $scope.average = DashboardFactory.calculateAverageWithWeightage(avg_from_test, avg_from_exam, avg_from_quiz);
                            if ($scope.average >= 75) {
                                $scope.graph.color = "#2ba14b";
                            } else if ($scope.average >= 50 && $scope.average < 75) {
                                $scope.graph.color = "#f1b500";
                            } else {
                                $scope.graph.color = "#e33e2b";
                            }
                        }
                    }, function(error) {
                        ionicToast.show(error, 'bottom', false, 2500);
                    });

                DashboardFactory.getMarksStatistics($scope.currentSubject.Id, $scope.loggedInUser.ClassId, $scope.loggedInUser.Id)
                    .then(function(success) {
                        $scope.tests = [];
                        if (success.data.Code != "S001") {
                            ionicToast.show(success.data.Message, 'bottom', false, 2500);
                        } else {
                            $scope.tests = success.data.Data;
                        }
                    }, function(error) {
                        ionicToast.show(error, 'bottom', false, 2500);
                    });

                DashboardFactory.getAttendanceStatistics($scope.currentSubject.Id, $scope.loggedInUser.Id)
                    .then(function(success) {
                        if (success.data.Code != "S001") {
                            ionicToast.show(success.data.Message, 'bottom', false, 2500);
                        } else {
                            $scope.attendanceStatistics = success.data.Data;
                        }
                    }, function(error) {
                        ionicToast.show(error, 'bottom', false, 2500);
                    });
            }
        };

        $scope.getAllKeywords = function() {
            DashboardFactory.getAllKeywords(LoginFactory.loggedInUser.Type)
                .then(function(success) {
                    if (success.data.Code != "S001") {
                        ionicToast.show(success.data.Message, 'bottom', false, 2500);
                    } else {
                        $scope.keywords = success.data.Data[0];
                    }
                }, function(error) {
                    ionicToast.show(error, 'bottom', false, 2500);
                });
        };

        $scope.learningReport = function() {
            LearningReportFactory.selectedSubject = $scope.currentSubject;
            $state.go('menu.learningReport')
        };

        $scope.studentSelected = function(student) {
            LoginFactory.loginStudent(student);
            $scope.selectedStudent = student;
            $scope.closePopover();
            $state.reload();
        };

        // $scope.studentAttendance = function() {
        //     SubjectStatisticsFactory.selected.subject = $scope.currentSubject;
        //     $state.go('menu.studentAttendance');
        // };

        // $scope.gotoAttendance = function(subject) {
        //     SubjectStatisticsFactory.selected.subject = subject;
        //     $state.go('menu.studentAttendance');
        // };

        function chunk(arr, size) {
            var newArr = [];
            for (var i = 0; i < arr.length; i += size) {
                newArr.push(arr.slice(i, i + size));
            }
            return newArr;
        }

        $scope.gotoElearning = function(subject) {
            if (subject.Id != 0) {
                LearningReportFactory.selectedSubject = subject;
                LoginFactory.NotificationState = null;
                LoginFactory.NotificationArgs = null;
                DashboardFactory.swiperFlag = 1;
                $state.go('menu.learningReport');
            } else {
                LessonPlanFactory.selectedChapter = {
                    Id: 0,
                    Name: "Quiz"
                };
                LessonPlanFactory.selectedChapterIndex = null;
                $state.go('menu.smartTestList');
            }
        };

        $scope.subjectSelected = function(subject) {
            if ($scope.loggedInUser.IsB2C == "true") {
                $scope.checkTrialPeriod(subject);
            } else {
                $scope.gotoElearning(subject);
            }
        };

        $scope.getAllAttendanceStatistics = function() {
            for (var i = 0; i < $scope.subjects.length; i++) {
                getStats(i);
            }
        };

        $scope.getEventsAndAssignments = function() {
            DashboardFactory.getEventsAndAssignments(LoginFactory.loggedInUser.CollegeId, LoginFactory.loggedInUser.ClassId)
                .then(function(success) {
                    $scope.eventsAndAssignments = [];
                    if (success.data.Code != "S001") {
                        ionicToast.show(success.data.Message, 'bottom', false, 2500);
                    } else {
                        $scope.eventsAndAssignments = success.data.Data;
                    }
                }, function(error) {
                    ionicToast.show(error, 'bottom', false, 2500);
                });
        };

        $scope.goToSlide = function(index, item) {
            $scope.modal.show();
            $scope.selectedItem = item;
            $ionicSlideBoxDelegate.slide(index);
        };

        // Called each time the slide changes
        $scope.imageChanged = function(index) {
            $scope.slideIndex = index;
        };

        $ionicModal.fromTemplateUrl('app/Dashboard/ImageViewer.html', {
            scope: $scope,
            animation: 'slide-in-up'
        }).then(function(modal) {
            $scope.modal = modal;
        });

        $scope.openModal = function() {
            $ionicSlideBoxDelegate.slide(0);
            $scope.modal.show();
        };

        $scope.closeModal = function() {
            $scope.modal.hide();
        };


        // topic rating template

        $ionicModal.fromTemplateUrl('app/Dashboard/TopicRatingTemplate.html', {
            scope: $scope,
            animation: 'slide-in-up'
        }).then(function(modal) {
            $scope.ratingModal = modal;
        });

        $scope.openRatingModal = function() {
            $scope.ratingModal.show();
        };

        $scope.closeRatingModal = function() {
            $scope.ratingModal.hide();
        };

        $scope.itemSelected = function(item) {
            if (item.EventDate == undefined) {
                AssignmentFactory.selectedAssignment = item;
                $state.go('menu.assignmentDetails');
            } else {
                EventsFactory.selectedEvent = item;
                $state.go('menu.eventDetails');
            }
        };

        var getStats = function(i) {
            DashboardFactory.getAttendanceStatistics($scope.subjects[i].Id, $scope.loggedInUser.Id)
                .then(function(success) {
                    $scope.subjects[i].AttendanceStatistics = success.data.Data;
                }, function(error) {
                    ionicToast.show(error, 'bottom', false, 2500);
                });
        };

        $scope.getAllTags = function(tagObj) {
            $scope.barGraphSeries = [];
            $scope.skillsToShow = [];
            $scope.skillsWithPerformance = [];
            $scope.chunkedData = [];
            $scope.chunkedPerformanceData = [];
            var obj = {
                SubjectIds: [tagObj.SubjectId],
                Type: 1
            };
            DashboardFactory.getAllTags(obj)
                .then(function(success) {
                    $scope.tags = [];
                    if (success.data.Code != "S001") {
                        ionicToast.show(success.data.Message, 'bottom', false, 2500);
                    } else {
                        $scope.tags = success.data.Data;
                        DashboardFactory.tags = angular.copy($scope.tags);
                        if ($scope.tags.length > 0) {
                            $scope.getStatsForTags($scope.tags);
                        }
                    }
                }, function(error) {
                    ionicToast.show(error, 'bottom', false, 2500);
                });
        };

        $scope.getStatsForTags = function(tags) {
            var iterations = 0;
            angular.forEach(tags, function(tag, tagIndex) {
                tag.Result = 0;
                var obj = {
                    StudentId: $scope.loggedInUser.Id,
                    ClassId: $scope.loggedInUser.ClassId,
                    SubjectId: $scope.currentSubject.Id,
                    Tag: tag.Name
                };
                DashboardFactory.getSubjectStatsForPrimeKeyword(obj)
                    .then(function(success) {
                        iterations++;
                        if (success.data.Code != "S001") {
                            ionicToast.show(success.data.Message, 'bottom', false, 2500);
                        } else {
                            var avg_from_exam = (success.data.Data.AverageFromExam == null) ? 0 : success.data.Data.AverageFromExam;
                            var avg_from_test = (success.data.Data.AverageFromTest == null) ? 0 : success.data.Data.AverageFromTest;
                            var avg_from_quiz = (success.data.Data.AverageFromQuiz == null) ? 0 : success.data.Data.AverageFromQuiz;
                            var overallAvg = DashboardFactory.calculateAverageWithWeightage(avg_from_test, avg_from_exam, avg_from_quiz);
                            if (overallAvg >= 0.01) {
                                tag.Result = overallAvg;
                            }
                            if (iterations == tags.length) {
                                $scope.skillsToShow = $scope.tags.filter(a => (a.Result > 0.01));
                                $scope.skillsWithPerformance = $scope.tags.filter(a => a.Result >= 75);
                                $scope.chunkedData = chunk($scope.skillsToShow, 3);
                                $scope.chunkedPerformanceData = chunk($scope.skillsWithPerformance, 3);
                            }
                        }
                    }, function(error) {
                        ionicToast.show(error, 'bottom', false, 2500);
                    });
            });
        };

        $scope.getAllAttendanceForStudent = function(subject) {
            $scope.currentSubject = subject;
            $scope.attendance = [];
            SubjectStatisticsFactory.getAllAttendance(LoginFactory.loggedInUser.Id, subject.Id)
                .then(function(success) {
                    if (success.data.Code != "S001") {
                        ionicToast.show(success.data.Message, 'bottom', false, 2500);
                    } else {
                        $scope.attendance = success.data.Data;
                    }
                    $scope.$broadcast('scroll.refreshComplete');
                }, function(error) {
                    ionicToast.show(error, 'bottom', false, 2500);
                });
        };

        $scope.topicRated = function(chapterIndex, topic) {
            var obj = {
                StudentId: LoginFactory.loggedInUser.Id,
                ChapterId: $scope.chapters[chapterIndex].Id,
                TopicId: topic.Id,
                ClassId: LoginFactory.loggedInUser.ClassId,
                Rating: topic.Rating
            };
            DashboardFactory.studentRatesTopic(obj)
                .then(function(success) {
                    if (success.data.Code != "S001") {
                        ionicToast.show(success.data.Message, 'bottom', false, 2500);
                    } else {
                        ionicToast.show('Thank you for your feedback', 'bottom', false, 2500);
                        $scope.getCurrentSubjectTopicsForToday(DashboardFactory.selectedSlide);
                    }
                }, function(error) {
                    ionicToast.show(error, 'bottom', false, 2500);
                });
        };

        $scope.skillSelected = function(skill) {
            ionicToast.show('Feature coming soon!', 'bottom', false, 2500);
            // LearningReportFactory.selectedSubject = $scope.currentSubject;
            // DashboardFactory.selectedSkill = skill;
            // //notification state
            // LoginFactory.NotificationState = null;
            // LoginFactory.NotificationArgs = null;
            // //swiper flag to check if its swiped or coming from a different page 
            // DashboardFactory.swiperFlag = 1;
            // $state.go('menu.upgradeSkills');
        };

        $scope.upgradeSkills = function() {
            ionicToast.show('Feature coming soon!', 'bottom', false, 2500);
            // LearningReportFactory.selectedSubject = $scope.currentSubject;
            // DashboardFactory.swiperFlag = 1;
            // $state.go('menu.skillsList');
        };

        $scope.analyseSkills = function(subject) {
            LearningReportFactory.selectedSubject = $scope.currentSubject;
            DashboardFactory.swiperFlag = 1;
            $state.go('menu.analyseSkills');
        };

        $scope.checkTrialPeriod = function(subject) {
            // check if student has paid fees
            var obj = {
                StudentId: LoginFactory.loggedInUser.Id,
                BranchId: LoginFactory.loggedInUser.BranchId
            };
            StudentDetailsFactory.getBalanceFeesforStudent(obj)
                .then(function(success) {
                    if (success.data.Code != "S001") {
                        ionicToast.show(success.data.Message, 'bottom', false, 2500);
                    } else {
                        $scope.hasPaidFees = success.data.Data.HasPaid;
                        if ($scope.hasPaidFees) {
                            $scope.gotoElearning(subject);
                        } else {
                            if (LoginFactory.loggedInUser.TrialStartDate != null) {
                                var trialStartDate = moment(LoginFactory.loggedInUser.TrialStartDate);
                                var currentDate = moment();
                                var remainingTrialDays = trialStartDate.diff(currentDate, 'days');
                                if (remainingTrialDays <= LoginFactory.loggedInUser.TrialPeriodDays) {
                                    $scope.gotoElearning(subject);
                                } else {
                                    // ask for payment
                                    var options = {
                                        description: 'FindInbox Subscription Fees',
                                        image: 'https://www.findinbox.com/app_images/Logo.png',
                                        currency: 'INR',
                                        key: payment.key,
                                        amount: '500.00',
                                        name: 'Ajith Simha T N',
                                        prefill: {
                                            email: 'ajith@findinbox.com',
                                            contact: '9739241152',
                                            name: 'Ajith Simha T N'
                                        },
                                        theme: {
                                            color: '#4a79c9'
                                        }
                                    }

                                    var successCallback = function(success) {
                                        console.log('hi');
                                        alert('payment_id: ' + success.razorpay_payment_id)
                                        var orderId = success.razorpay_order_id
                                        var signature = success.razorpay_signature
                                    };

                                    var cancelCallback = function(error) {
                                        console.log('no');
                                        alert(error.description + ' (Error ' + error.code + ')')
                                    };

                                    RazorpayCheckout.on('payment.success', successCallback)
                                    RazorpayCheckout.on('payment.cancel', cancelCallback)
                                    RazorpayCheckout.open(options)
                                }
                            } else {
                                var confirmPopup = $ionicPopup.show({
                                    title: 'Start your Free Trial',
                                    template: 'Start your free trial for ' + LoginFactory.loggedInUser.TrialPeriodDays + ' days!',
                                    scope: $scope,
                                    buttons: [{
                                            text: 'Cancel'
                                        },
                                        {
                                            text: '<b>Start Trial</b>',
                                            type: 'button-custom',
                                            onTap: function(e) {
                                                var obj = {
                                                    TrialStartDate: moment().format("YYYY-MM-DD"),
                                                    StudentId: LoginFactory.loggedInUser.Id
                                                };
                                                StudentDetailsFactory.setTrialStartDate(obj)
                                                    .then(function(success) {
                                                        if (success.data.Code != "S001") {
                                                            ionicToast.show(success.data.Message, 'bottom', false, 2500);
                                                        } else {
                                                            LoginFactory.loggedInUser.TrialStartDate = moment().format();
                                                            $scope.gotoElearning(subject);
                                                        }
                                                    });
                                            }
                                        }
                                    ]
                                });
                            }
                        }
                    }
                }, function(error) {
                    ionicToast.show(error, 'bottom', false, 2500);
                });
        };

        $scope.getAllKeywords();
        if ($scope.loggedInUser.PackageCode == 'LM') {
            $scope.getEventsAndAssignments();
        } else {
            $scope.getAllSubjects();
        }
    });