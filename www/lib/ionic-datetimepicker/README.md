##Introduction:

This is an `ionic-datetimepicker` bower component, which can be used in any Ionic framework's application. No additional plugins required for this component.

[View Datepicker Demo](http://rajeshwarpatlolla.github.io/DatePickerForIonicFramework/demo/ "Demo")
[View Timepicker Demo](http://rajeshwarpatlolla.github.io/TimePickerForIonicFramework/demo/ "Demo")

##Prerequisites.

* node.js
* npm
* bower
* gulp

##How to use:

1) In your project repository install the ionic-datetimepicker using bower

`bower install katemihalikova/ionic-datetimepicker --save`

This will install the latest version released.

2) Give the path of  `ionic-datetimepicker.bundle.min.js` in your `index.html` file.

````html
<!-- path to ionic/angularjs -->
<script src="lib/ionic-datetimepicker/dist/ionic-datetimepicker.bundle.min.js"></script>
````

3) In your application module inject the dependency `ionic-datetimepicker`, in order to work with the ionic time picker
````javascript
angular.module('mainModuleName', ['ionic', 'ionic-datetimepicker']);
````

4) Use the below format in your template's corresponding controller

````javascript
$scope.datetimepickerObject = {
    titleLabel: 'Title',                  // Optional
    closeLabel: 'Close',                  // Optional
    setLabel: 'Set',                      // Optional
    setButtonType : 'button-assertive',   // Optional
    closeButtonType : 'button-assertive', // Optional
    inputDatetime: new Date(),            // Optional
    step: 15,                             // Optional
    format: 24,                           // Optional
    mondayFirst: true,                    // Optional
    disabledDates: disabledDates,         // Optional
    weekDaysList: weekDaysList,           // Optional
    monthList: monthList,                 // Optional
    from: new Date(2012, 8, 2),           // Optional
    to: new Date(2018, 8, 25),            // Optional
    callback: function (val) {            // Required
        datetimePickerCallback(val);
    }
};
````

**$scope.datetimepickerObject** is the main object, that we need to pass to the directive. The properties of this object are as follows.

**a) titleLabel**(Optional) : The label for `Title` of the ionic-datetimepicker popup. Default value is `Select Date`.

**b) closeLabel**(Optional) : The label for `Close` button. Default value is `Close`.

**c) setLabel**(Optional) : The label for `Set` button. Default value is `Set`.

**d) setButtonType**(Optional) : This the type of the `Set` button. Default value is `button-positive`. You can give any valid ionic framework's button classes.

**e) closeButtonType**(Optional) : This the type of the `Close` button. Default value is `button-stable`. You can give any valid ionic framework's button classes.

**f) inputDatetime**(Optional) : This is the date object to pass to the directive. You can give any date object to this property. Default value is `new Date()`. But if you wish to show the initial date in the HTML page, then you should define this property.

**g) step** (Optional) : This the minute increment / decrement step. Default value is `15`.

**h) format** (Optional) : This the format of the time. It can be one of two values i.e.`12` or `24`. Default value is `24`.

**i) mondayFirst**(Optional) : Set `true` if you wish to show Monday as the first day. Default value is `false`.

**j) disabledDates**(Optional) : If you have a list of dates to disable, you can create an array like below. Default value is an empty array.
````javascript
var disabledDates = [
    new Date(1437719836326),
    new Date(),
    new Date(2015, 7, 10), // Months are 0-based, this is August, 10th!
    new Date('Wednesday, August 12, 2015'), // Works with any valid Date formats like long format
    new Date("08-14-2015"), // Short format
    new Date(1439676000000) // UNIX format
];
````

**k) weekDaysList**(Optional) : This is an array with a list of all week days. You can use this if you want to show months in some other language or format or if you wish to use the modal instead of the popup for this component (Refer to point **l**), you can define the `weekDaysList` array in your controller as shown below.
````javascript
var weekDaysList = ["Sun", "Mon", "Tue", "Wed", "thu", "Fri", "Sat"];
````
 The default values are
````javascript
["S", "M", "T", "W", "T", "F", "S"];
````

**l) monthList**(Optional) : This is an array with a list of all months. You can use this if you want to show months in some other language or format. You can create an array like below.
````javascript
var monthList = ["Jan", "Feb", "March", "April", "May", "June", "July", "Aug", "Sept", "Oct", "Nov", "Dec"];
````
 The default values are
````javascript
["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
````

**m) from**(Optional) : This is a date object, from which you wish to enable the dates. You can use this property to disable **previous dates** by specifying `from: new Date()`. By default all the dates are enabled. Please note that months are 0 based.

**n) to**(Optional) : This is a date object, to which you wish to enable the dates. You can use this property to disable **future dates** by specifying `to: new Date()`. By default all the dates are enabled. Please note that months are 0 based.

**o) callback**(Mandatory) : This the callback function, which will get the selected date in to the controller. You can define this function as follows.
````javascript
var datetimePickerCallback = function(val) {
    if (typeof val === 'undefined') {
	console.log('No datetime selected');
    } else {
	console.log('Selected datetime is: ', val)
    }
};
````

5) Then use the below format in your template / html file

````html
<ionic-datetimepicker input-obj="datetimepickerObject">
    <button class="button button-block button-positive"> {{datetimepickerObject.inputDate | date:'medium'}}</button>
</ionic-datetimepicker>
````

**a) ionic-datetimepicker** is the directive, to which we can pass required vales.

**b) input-obj**(Mandatory) : This is an object. We have to pass an object as shown above.

##Screen Shots:

Once you are successfully done with the above steps, you should be able to see the below screen shots.
I have used two buttons here.

The first screen shot shows only the buttons before clicking on them.
Once you click on the button you should see the second screen shot.

<img src="https://lh3.googleusercontent.com/IeNOa_UmMpRhWCP4Hl2Cc4ZO1YuwNAd4vmKBYzsX2FY=w434-h678-no" width="300" height="450" />
<img src="https://lh3.googleusercontent.com/IGjqpsiPj1_92DTiW2oJcSvBTdp93PGOYEk4VzQiABg=w442-h678-no" width="300" height="450" />

<img src="https://lh6.googleusercontent.com/-UL18wuskI_A/VNHkGj8tdwI/AAAAAAAADdU/5tBbZcF6_es/w328-h494-no/TimePicker-1.jpg" width="300" height="450" />
<img src="https://lh5.googleusercontent.com/-xgqgH2zRSuA/VNHkGQ6R8cI/AAAAAAAADdQ/5gGJ1nUqmA0/w328-h494-no/TimePicker-2.jpg" width="300" height="450" />

##CSS Classes:

<img src="https://lh3.googleusercontent.com/tX9IyFN9w3GigHnltCJCdSj1Df5OjDDqxPXmNr7oAdQ=w423-h634-no" width="300" height="450" />

#### 1) ionic_datetimepicker_modal_content
#### 2) selected_date_full
#### 3) left_arrow
#### 4) drop_down
#### 5) month_dropdown
#### 6) year_dropdown
#### 7) right_arrow
#### 8) date_col
#### 9) date_selected
#### 10) calendar_grid

You can use these classes to customize the alignment, if required.

##Versions:

### 1) v0.1.0
Initial version. Merged ionic-datepicker v0.9.0 and ionic-timepicker v0.3.0.



##License:
[MIT](https://github.com/katemihalikova/ionic-datetimepicker/blob/master/LICENSE.MD "MIT")

##Contact:
mail : kate@katemihalikova.cz

github : https://github.com/katemihalikova

twitter : https://twitter.com/katemihalikova

facebook : https://www.facebook.com/katemihalikova

[comment]: # (Comment or Rate it : http://market.ionic.io/plugins/ionicdatepicker)