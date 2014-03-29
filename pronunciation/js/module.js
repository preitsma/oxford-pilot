window.console = window.console || {};
window.console.log = window.console.log || function() {};

angular.module('myApp.service',[]).
    factory('DataSource', ['$http',function($http){
       return {
           get: function(file,callback,transform){
                $http.get(
                    file,
                    {transformResponse:transform}
                ).
                success(function(data, status) {
                    callback(data);
                }).
                error(function(data, status) {
                    alert('');
                });
           }
       };
    }]);

angular.module('myApp',['myApp.service','ngDragDrop']);

var AppController = function($scope,$sce,$timeout,DataSource) {

    var SOURCE_FILE = "content/xml/content.xml";

    $scope.playing = false;
    $scope.groupCounter = 0;
    $scope.questions = [];
    $scope.options = [];
    $scope.maxGroups = 0;
    $scope.finished = false;
    var optionsBackup;

    $scope.sounds = [];

    initSound = function(name) {
        $scope.sounds[name] = new buzz.sound('content/shared_assets/audio/' + name, {
                    formats: [ "ogg", "mp3"]
                  })
                  .bind("ended", function(e) { $scope.playing = false; })
                  .load();
    }
 
    initSound('applause');
    initSound('click_high');
    initSound('click_low');
    initSound('drop');
    initSound('wrong');

       console.log($scope.sounds['click_low']);

    
    xmlTransform = function(data) {
        console.log("transform data");
        var x2js = new X2JS();
        var json = x2js.xml_str2json( data );
        //console.log(json.compositequiz.quizzes.quiz.questionGroup[0]);
        return json;
    };
    
    setData = function(data) {
        $scope.questionGroup = data.compositequiz.quizzes.quiz.questionGroup[$scope.groupCounter];
        $scope.maxGroups = data.compositequiz.quizzes.quiz.questionGroup.length;
        console.log($scope.maxGroups);
        angular.forEach($scope.questionGroup.question, function(question) {
           question.answerGiven = false;
           question.status = 'NO_ANSWER';
           question.sound = new buzz.sound(question.questionItems.item[0]._hintaudiopath.replace(/\.[^/.]+$/, ""), {
                    formats: [ "ogg", "mp3"]
                  })
                  .bind("ended", function(e) { $scope.playing = false; })
                  .load();
           console.log(question);
        });
        $scope.options = $scope.questionGroup.options.option;
        optionsBackup = jQuery.extend(true, {}, $scope.options);
        $scope.questions = $scope.questionGroup.question;
        $scope.title = $sce.trustAsHtml(data.compositequiz.quizzes.quiz.rubric.__cdata);
        $scope.shownCounter = 0;
    };

    getCorrectAnswerId = function(question) {
        answerId = 0;
        angular.forEach(question.questionItems.item, function(item) {
            if(item._type == 'lozenge') {
               answerId = item.answers.answer._answerid
            } 
        });
        return answerId;
    }

    getCorrectOption = function(question) {
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
        console.log($scope.sounds[name]);
        $scope.playSound($scope.sounds[name]);
    }

    $scope.playSound = function(sound) {
       if ($scope.playing == false) {
          $scope.playing = true;  
          sound.play();
       }
    }

    $scope.onDrop = function(e, b, index) {
        //restore the options
        $scope.options = jQuery.extend(true, {}, optionsBackup);

        $scope.playFile(null,null,'drop');
        question = $scope.questions[index];
        question.answerGiven = true;
        question.status = 'ANSWER_GIVEN';
    }

    $scope.tryAgain = function() {
         angular.forEach($scope.questions, function(question) {
           if ( question.status == 'ANSWER_WRONG') {
                question.givenAnswer = '     ';
                question.givenAnswerId = 0;
                question.answerGiven = false;
                question.status = 'NO_ANSWER';
           }
        });
    }

    $scope.checkAnswer = function() {
        allCorrect = true;
        angular.forEach($scope.questions, function(question) {
           if ( question.givenAnswer._optionid == getCorrectOption(question)._optionid ) {
               question.status = 'ANSWER_CORRECT';
           } else {
               question.status = 'ANSWER_WRONG';
               allCorrect = false;
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
        if( $scope.groupCounter < $scope.maxGroups-1 ) {
           $timeout(function(e) {
             $scope.groupCounter++;
             $scope.reset();
          }, 3000);
        } else {
           $scope.finished = true;
        }
    }

    $scope.reset = function() {
        DataSource.get(SOURCE_FILE,setData,xmlTransform);
    }

    $scope.restart = function() {
        $scope.groupCounter = 0;
        $scope.finished = false;
        $scope.reset();
    }

    $scope.seeNextAnswer = function() {
        question = $scope.questions[$scope.shownCounter];
        question.givenAnswer = getCorrectOption(question);
        question.status = 'ANSWER_SHOWN';  
        question.answerGiven = true;         
        $scope.shownCounter++;
        if ($scope.shownCounter == $scope.questions.length) {
            $scope.skipNext();
        }
    }

    $scope.seeAllAnswers = function() {
        $scope.shownCounter = $scope.questions.length;
        angular.forEach($scope.questions, function(question) {
            question.givenAnswer = getCorrectOption(question);
            question.status = 'ANSWER_SHOWN';  
            question.answerGiven = true;    
        });
        $scope.skipNext();
    }

    $scope.isComplete = function() { //all answers are given or correct
        ret = true;
        angular.forEach($scope.questions, function(question) {
           if (question.status != 'ANSWER_GIVEN' && question.status != 'ANSWER_CORRECT' && question.status != 'ANSWER_SHOWN') {
             ret = false;
           }
        });
        if (ret == true) {
            return $scope.shownCounter < $scope.questions.length;
        } else {
           return false;
        }
    }

    $scope.isStarted = function() { //at least one answer is given
        ret = false;
        angular.forEach($scope.questions, function(question) {
           if (question.answerGiven == true) {
             ret = true
           }
        });
        return ret;
    }

    $scope.someWrong = function() { //at least one wrong
        ret = false;
        angular.forEach($scope.questions, function(question) {
           if (question.status == 'ANSWER_WRONG') {
             ret = true
           }
        });
        return ret;
    }


    DataSource.get(SOURCE_FILE,setData,xmlTransform);

};