/**
 *  Created by P.S.D. Reitsma
 *  Date: 29/3/14
 *  (c) 2010-2014 Plance, http://www.plance.nl
 */

//prevent errors in IE
window.console = window.console || {};
window.console.log = window.console.log || function() {};

angular.module('myApp.service',[]).
    factory('DataSource', ['$http',function($http){ //factory to fetch the content
       return {
           get: function(file,callback,transform){
                $http.get(
                    file,
                    {transformResponse:transform}
                ).
                success(function(data, status) {
                    console.log(status);
                    callback(data);
                }).
                error(function(data, status) {
                    alert('Something went wrong parsing ' + file);
                });
           }
       };
    }]);

angular.module('myApp',['myApp.service','ngDragDrop']);

var AppController = function($scope,$sce,$timeout,DataSource) { //main controller

    SOURCE_FILE = "content/xml/content.xml";
    SOUND_PATH = "content/shared_assets/audio/";

    $scope.playing = false;
    $scope.groupCounter = 0;
    $scope.questions = [];
    $scope.options = [];
    $scope.maxGroups = 0;
    $scope.finished = false;

    var optionsBackup;

    $scope.sounds = [];

    initSound = function(fileName) {
        return new buzz.sound(fileName.replace(/\.[^/.]+$/, ""), {
                    formats: [ "ogg", "mp3"]
                  })
                  .bind("ended", function(e) { $scope.playing = false; })
                  .load();
    }

    cacheSound = function(fileName) {
        $scope.sounds[fileName] = initSound(SOUND_PATH + fileName);
    }
 
    cacheSound('applause');
    cacheSound('click_high');
    cacheSound('click_low');
    cacheSound('drop');
    cacheSound('wrong');

    
    xmlTransform = function(data) {
        var x2js = new X2JS();
        var json = x2js.xml_str2json( data );
        return json;
    };
    
    setData = function(data) { //initialize the game state
        $scope.maxGroups = data.compositequiz.quizzes.quiz.questionGroup.length;
        $scope.questionGroup = data.compositequiz.quizzes.quiz.questionGroup[$scope.groupCounter];
        $scope.questions = $scope.questionGroup.question;
 
        angular.forEach($scope.questions, function(question) {
           question.status = 'NO_ANSWER';
           question.sound = initSound(question.questionItems.item[0]._hintaudiopath);
        });

        $scope.options = $scope.questionGroup.options.option;
        optionsBackup = jQuery.extend(true, {}, $scope.options); //backup needed because drag-drop module removes option after dragging.
        $scope.title = $sce.trustAsHtml(data.compositequiz.quizzes.quiz.rubric.__cdata);
        $scope.shownCounter = 0;
    };

    getCorrectOption = function(question) { //gets the right option/answer for question
        retOption = null;
        angular.forEach(question.questionItems.item, function(item) {
            if(item._type == 'lozenge') {
                answerId = item.answers.answer._answerid

                angular.forEach($scope.options, function(option) {
                    if (option._optionid ==  item.answers.answer._answerid) {
                        retOption = option;
                    }
                });

            } 
        });
        return retOption;
    }

    $scope.playFile = function(a,b,name) {
        $scope.playSound($scope.sounds[name]);
    }

    $scope.playSound = function(sound) {
       if ($scope.playing == false) {
            $scope.playing = true;  
            sound.play();
       }
    }

    $scope.onDrop = function(e, b, index) {
        //restore the option that have been removed by d&d module
        $scope.options = jQuery.extend(true, {}, optionsBackup);
        $scope.playFile(null,null,'drop');
        question = $scope.questions[index]; //option has been added to question
        question.status = 'ANSWER_GIVEN';
    }

    $scope.tryAgain = function() {
         angular.forEach($scope.questions, function(question) {
           if ( question.status == 'ANSWER_WRONG') {
                question.givenAnswer = null;
                question.status = 'NO_ANSWER';
           }
        });
    }

    $scope.checkAnswer = function() {
        allCorrect = true;
        angular.forEach($scope.questions, function(question) {
           if (question.status != 'ANSWER_SEEN') {
               if (question.givenAnswer._optionid == getCorrectOption(question)._optionid) {
                   question.status = 'ANSWER_CORRECT';
               } else {
                   question.status = 'ANSWER_WRONG';
                   allCorrect = false;
               }
            }     
        });
        if (allCorrect) {
            $scope.playFile(null,null,"applause");
            $scope.skipNext();
        } else {
            $scope.playFile(null,null,"wrong");
        }
    };

    $scope.skipNext = function() {
        console.log($scope.groupCounter + ' ' + $scope.maxGroups);
        if ($scope.groupCounter < $scope.maxGroups-1) {
           $timeout(function(e) {
             $scope.groupCounter++;
             $scope.init();
          }, 3000);
        } else {
           $scope.finished = true;
        }
    }

    $scope.init = function() {
        DataSource.get(SOURCE_FILE,setData,xmlTransform);
    }

    $scope.restart = function() {
        $scope.groupCounter = 0;
        $scope.finished = false;
        $scope.init();
    }

    $scope.seeNextAnswer = function() {
        question = $scope.questions[$scope.shownCounter];
        question.givenAnswer = getCorrectOption(question);
        question.status = 'ANSWER_SEEN';       
        $scope.shownCounter++;
        if ($scope.shownCounter == $scope.questions.length) {
            $scope.skipNext();
        }
    }

    $scope.seeAllAnswers = function() {
        $scope.shownCounter = $scope.questions.length;
        angular.forEach($scope.questions, function(question) {
            question.givenAnswer = getCorrectOption(question);
            question.status = 'ANSWER_SEEN';  
        });
        $scope.skipNext();
    }

    $scope.isComplete = function() { //all answers are filled in but not all shown
        ret = true;
        angular.forEach($scope.questions, function(question) {
           if (question.status == 'NO_ANSWER') {
                ret = false;
           }
        });
        return ret && ($scope.shownCounter != $scope.questions.length);
    }

    $scope.isStarted = function() { //at least one answer is given
        ret = false;
        angular.forEach($scope.questions, function(question) {
           if (question.status != 'NO_ANSWER') {
                ret = true
           }
        });
        return ret;
    }

    $scope.someWrong = function() { //at least one answer is wrong
        ret = false;
        angular.forEach($scope.questions, function(question) {
           if (question.status == 'ANSWER_WRONG') {
                ret = true
           }
        });
        return ret;
    }

    $scope.init();

};