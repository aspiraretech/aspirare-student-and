// By Rajeshwar Patlolla & Kate Miháliková
// https://github.com/rajeshwarpatlolla
// https://github.com/katemihalikova

(function() {
    'use strict';

    angular.module('ionic-datetimepicker')
        .directive('ionicDatetimepicker', IonicDatetimepicker);

    IonicDatetimepicker.$inject = ['$ionicPopup', '$ionicModal', 'IonicDatetimepickerService'];
    function IonicDatetimepicker($ionicPopup, $ionicModal, IonicDatetimepickerService) {
        return {
            restrict: 'AE',
            replace: true,
            scope: {
                inputObj: "=inputObj"
            },
            link: function(scope, element, attrs) {

                scope.currentMonth = '';
                scope.currentYear = '';
                scope.disabledDates = [];

                //Setting the title, close and set strings for the date picker
                scope.titleLabel = scope.inputObj.titleLabel ? (scope.inputObj.titleLabel) : 'Select Date';
                scope.closeLabel = scope.inputObj.closeLabel ? (scope.inputObj.closeLabel) : 'Close';
                scope.setLabel = scope.inputObj.setLabel ? (scope.inputObj.setLabel) : 'Set';
                scope.errorMsgLabel = scope.inputObj.errorMsgLabel ? (scope.inputObj.errorMsgLabel) : 'Please select a date.';
                scope.setButtonType = scope.inputObj.setButtonType ? (scope.inputObj.setButtonType) : 'button-positive';
                scope.closeButtonType = scope.inputObj.closeButtonType ? (scope.inputObj.closeButtonType) : 'button-stable';
                scope.step = scope.inputObj.step ? scope.inputObj.step : 15;
                scope.format = scope.inputObj.format ? +scope.inputObj.format : 24;

                scope.enableDatesFrom = {epoch: 0, isSet: false};
                scope.enableDatesTo = {epoch: 0, isSet: false};

                scope.time = {hours: 0, minutes: 0, meridian: ""};

                // creating buttons
                var buttons = [
                    {
                        text: scope.closeLabel,
                        type: scope.closeButtonType,
                        onTap: function() {
                            scope.inputObj.callback(undefined);
                        }
                    }, {
                        text: scope.setLabel,
                        type: scope.setButtonType,
                        onTap: function() {
                            dateSelected();
                        }
                    }
                ];

                //Setting the from and to dates
                if (scope.inputObj.from) {
                    scope.enableDatesFrom.isSet = true;
                    scope.enableDatesFrom.epoch = scope.inputObj.from.getTime();
                }

                if (scope.inputObj.to) {
                    scope.enableDatesTo.isSet = true;
                    scope.enableDatesTo.epoch = scope.inputObj.to.getTime();
                }

                //Setting the input date for the date picker
                if (scope.inputObj.inputDate) {
                    scope.ipDate = scope.inputObj.inputDate;
                } else {
                    scope.ipDate = new Date();
                }
                scope.selectedDateFull = scope.ipDate;

                //Setting the months list. This is useful, if the component needs to use some other language.
                scope.monthsList = [];
                if (scope.inputObj.monthList && scope.inputObj.monthList.length === 12) {
                    scope.monthsList = scope.inputObj.monthList;
                } else {
                    scope.monthsList = IonicDatetimepickerService.monthsList;
                }
                if (scope.inputObj.weekDaysList && scope.inputObj.weekDaysList.length === 7) {
                    scope.weekNames = scope.inputObj.weekDaysList;
                } else {
                    scope.weekNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
                }
                scope.yearsList = IonicDatetimepickerService.yearsList;

                //Setting whether to show Monday as the first day of the week or not.
                if (scope.inputObj.mondayFirst) {
                    scope.mondayFirst = true;
                } else {
                    scope.mondayFirst = false;
                }

                //Setting the disabled dates list.
                if (scope.inputObj.disabledDates && scope.inputObj.disabledDates.length === 0) {
                    scope.disabledDates = [];
                } else {
                    angular.forEach(scope.inputObj.disabledDates, function(val, key) {
                        val.setHours(0);
                        val.setMinutes(0);
                        val.setSeconds(0);
                        val.setMilliseconds(0);

                        scope.disabledDates.push(val.getTime());
                    });
                }

                function prepareTime() {
                    scope.time.hours = currentDate.getHours();
                    scope.time.minutes = currentDate.getMinutes();
                    processTime();
                };

                function processTime() {
                    scope.time.hours = +scope.time.hours;
                    scope.time.minutes = +scope.time.minutes;
                    scope.time.meridian = scope.time.hours >= 12 ? "PM" : "AM";
                    if (scope.format === 12) {
                        scope.time.hours = scope.time.hours % 12;
                        scope.time.hours = scope.time.hours === 0 ? 12 : scope.time.hours;
                    }
                    scope.time.hours = (scope.time.hours < 10) ? ('0' + scope.time.hours) : scope.time.hours;
                    scope.time.minutes = (scope.time.minutes < 10) ? ("0" + scope.time.minutes) : (scope.time.minutes);
                    datetimeChanged();
                };

                var currentDate = angular.copy(scope.ipDate);
                currentDate.setSeconds(0);
                currentDate.setMilliseconds(0);

                scope.selectedDateString = currentDate.toDateString();
                scope.today = {};

                if (scope.mondayFirst === true) {
                    scope.weekNames.push(scope.weekNames.shift());
                }

                var tempTodayObj = new Date();
                var tempToday = new Date(tempTodayObj.getFullYear(), tempTodayObj.getMonth(), tempTodayObj.getDate());

                scope.today = {
                    dateObj: tempTodayObj,
                    date: tempToday.getDate(),
                    month: tempToday.getMonth(),
                    year: tempToday.getFullYear(),
                    day: tempToday.getDay(),
                    dateString: tempToday.toDateString(),
                    epochLocal: tempToday.getTime(),
                    epochUTC: (tempToday.getTime() + (tempToday.getTimezoneOffset() * 60 * 1000))
                };

                function refreshDateList(current_date) {
                    current_date.setSeconds(0);
                    current_date.setMilliseconds(0);

                    scope.selectedDateString = (new Date(current_date)).toDateString();
                    currentDate = angular.copy(current_date);

                    var firstDay = new Date(current_date.getFullYear(), current_date.getMonth(), 1).getDate();
                    var lastDay = new Date(current_date.getFullYear(), current_date.getMonth() + 1, 0).getDate();

                    scope.dayList = [];

                    for (var i = firstDay; i <= lastDay; i++) {
                        var tempDate = new Date(current_date.getFullYear(), current_date.getMonth(), i);
                        scope.dayList.push({
                            date: tempDate.getDate(),
                            month: tempDate.getMonth(),
                            year: tempDate.getFullYear(),
                            day: tempDate.getDay(),
                            dateString: tempDate.toDateString(),
                            epochLocal: tempDate.getTime(),
                            epochUTC: (tempDate.getTime() + (tempDate.getTimezoneOffset() * 60 * 1000))
                        });
                    }

                    //To set Monday as the first day of the week.
                    var firstDayMonday = scope.dayList[0].day - scope.mondayFirst;
                    firstDayMonday = (firstDayMonday < 0) ? 6 : firstDayMonday;

                    scope.currentMonthFirstDayEpoch = scope.dayList[0].epochLocal;
                    scope.currentMonthLastDayEpoch = scope.dayList[scope.dayList.length - 1].epochLocal;

                    for (var j = 0; j < firstDayMonday; j++) {
                        scope.dayList.unshift({});
                    }

                    scope.rows = [];
                    scope.cols = [];

                    scope.currentMonth = scope.monthsList[current_date.getMonth()];
                    scope.currentYear = current_date.getFullYear();
                    scope.currentMonthSelected = scope.currentMonth;
                    scope.currentYearSelected = scope.currentYear;

                    scope.numColumns = 7;
                    scope.rows.length = 6;
                    scope.cols.length = scope.numColumns;
                };

                scope.monthChanged = function(month) {
                    var monthNumber = scope.monthsList.indexOf(month);
                    currentDate.setMonth(monthNumber);
                    datetimeChanged();
                };

                scope.yearChanged = function(year) {
                    currentDate.setFullYear(year);
                    datetimeChanged();
                };

                scope.prevMonth = function() {
                    if (currentDate.getMonth() === 1) {
                        currentDate.setFullYear(currentDate.getFullYear());
                    }
                    currentDate.setMonth(currentDate.getMonth() - 1);
                    scope.currentMonth = scope.monthsList[currentDate.getMonth()];
                    scope.currentYear = currentDate.getFullYear();
                    datetimeChanged();
                };

                scope.nextMonth = function() {
                    if (currentDate.getMonth() === 11) {
                        currentDate.setFullYear(currentDate.getFullYear());
                    }
                    currentDate.setMonth(currentDate.getMonth() + 1);
                    scope.currentMonth = scope.monthsList[currentDate.getMonth()];
                    scope.currentYear = currentDate.getFullYear();
                    datetimeChanged();
                };

                scope.date_selection = {selected: false, selectedDate: '', submitted: false};
                scope.date_selection.selected = true;
                scope.date_selection.selectedDate = scope.ipDate;

                //Called when the user clicks on any date.
                scope.dateSelected = function(date) {
                    if (!date)
                        return;
                    scope.selectedDateString = date.dateString;
                    scope.selectedDateStringCopy = angular.copy(scope.selectedDateString);
                    scope.date_selection.selected = true;
                    scope.date_selection.selectedDate = new Date(date.dateString);
                    scope.date_selection.selectedDate.setHours(currentDate.getHours());
                    scope.date_selection.selectedDate.setMinutes(currentDate.getMinutes());
                    scope.selectedDateFull = scope.date_selection.selectedDate;
                    refreshDateList(scope.date_selection.selectedDate);
                };

                function dateSelected() {
                    scope.date_selection.submitted = true;
                    if (scope.date_selection.selected === true) {
                        scope.inputObj.callback(scope.date_selection.selectedDate);
                    }
                }

                function datetimeChanged() {
                    scope.dateSelected({
                        date: currentDate.getDate(),
                        month: currentDate.getMonth(),
                        year: currentDate.getFullYear(),
                        day: currentDate.getDay(),
                        dateString: currentDate.toDateString(),
                        epochLocal: currentDate.getTime(),
                        epochUTC: (currentDate.getTime() + (currentDate.getTimezoneOffset() * 60 * 1000))
                    });
                    refreshDateList(currentDate);
                };

                scope.increaseHours = function() {
                    currentDate.setHours(currentDate.getHours() + 1);
                    scope.time.hours = currentDate.getHours();
                    processTime();
                };

                scope.decreaseHours = function() {
                    currentDate.setHours(currentDate.getHours() - 1);
                    scope.time.hours = currentDate.getHours();
                    processTime();
                };

                scope.increaseMinutes = function() {
                    var currMinutes = currentDate.getMinutes();
                    currMinutes = Math.floor(currMinutes / scope.step) * scope.step;
                    currentDate.setMinutes(currMinutes + scope.step);
                    scope.time.hours = currentDate.getHours();
                    scope.time.minutes = currentDate.getMinutes();
                    processTime();
                };

                scope.decreaseMinutes = function() {
                    var currMinutes = currentDate.getMinutes();
                    currMinutes = Math.ceil(currMinutes / scope.step) * scope.step;
                    currentDate.setMinutes(currMinutes - scope.step);
                    scope.time.hours = currentDate.getHours();
                    scope.time.minutes = currentDate.getMinutes();
                    processTime();
                };

                scope.increaseMeridian = function() {
                    currentDate.setHours(currentDate.getHours() + 12);
                    scope.time.hours = currentDate.getHours();
                    processTime();
                };

                scope.decreaseMeridian = function() {
                    currentDate.setHours(currentDate.getHours() - 12);
                    scope.time.hours = currentDate.getHours();
                    processTime();
                };

                //Called when the user clicks on the button to invoke the 'ionic-datepicker'
                element.on("click", function() {
                    if (scope.date_selection.selectedDate) {
                        refreshDateList(scope.date_selection.selectedDate);
                    } else if (scope.ipDate) {
                        refreshDateList(angular.copy(scope.ipDate));
                    } else {
                        refreshDateList(new Date());
                    }
                    prepareTime();
                    //Getting the reference for the 'ionic-datepicker' popup.
                    $ionicPopup.show({
                        templateUrl: 'ionic-datepicker-popup.html',
                        title: scope.titleLabel,
                        subTitle: '',
                        scope: scope,
                        buttons: buttons
                    });
                });
            }
        };
    }

})();
