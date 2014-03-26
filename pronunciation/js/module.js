angular.module('myApp.service',[]).
    factory('DataSource', ['$http',function($http){
       return {
           get: function(file,callback,transform){
                $http.get(
                    file,
                    {transformResponse:transform}
                ).
                success(function(data, status) {
                    console.log("Request succeeded");
                    callback(data);
                }).
                error(function(data, status) {
                    console.log("Request failed " + status);
                });
           }
       };
    }]);

angular.module('myApp',['myApp.service','ngDragDrop']);

var AppController = function($scope,$sce,DataSource) {

    var SOURCE_FILE = "content/xml/content.xml";
    
    $scope.IMAGE_LOCATION = "http://rabidgadfly.com/assets/angular/xmlload/";

    $scope.playing = false;
    
    xmlTransform = function(data) {
        console.log("transform data");
        var x2js = new X2JS();
        var json = x2js.xml_str2json( data );
        console.log(json.compositequiz.quizzes.quiz.questionGroup[0]);
        return json;
    };
    
    setData = function(data) {
        $scope.questionGroup = data.compositequiz.quizzes.quiz.questionGroup[0];
        
        angular.forEach($scope.questionGroup.question, function(question) {
           question.givenAnswer = '     ';
           question.answerGiven = false;
           console.log(question);
        });
        $scope.options = $scope.questionGroup.options.option;
        $scope.title = $sce.trustAsHtml(data.compositequiz.quizzes.quiz.rubric.__cdata);
        $scope.answerChecked = false;
        $scope.notComplete = true;
        $scope.offTheMark = false;
        $scope.tryAgainEnabled = false;
    };

    $scope.$on('ANGULAR_DRAG_START', function(e) {$scope.playClip("content/shared_assets/audio/click_high")});
    $scope.$on('ANGULAR_DRAG_END', function(e) {$scope.playClip("content/shared_assets/audio/drop")});


    $scope.playClip = function(src){
         if($scope.playing == false) {
                  var mySound = new buzz.sound(src.replace(/\.[^/.]+$/, ""), {
                    formats: [ "ogg", "mp3"]
                  });
                  mySound.bind("ended", function(e) { $scope.playing = false; });
                  mySound.load();
                  mySound.play();
                  $scope.playing = true;
         }
    };

    $scope.onDrop = function($event,$answer,$question){
        $question.givenAnswer = $answer.__cdata;
        $question.givenAnswerId = $answer._optionid;
        $question.answerGiven = true;
        console.log($question); 
        $scope.notComplete = false;
        angular.forEach($scope.questionGroup.question, function(question) {
           if(!question.answerGiven) $scope.notComplete = true;
        });
        console.log("$scope.notComplete:" + $scope.notComplete);   
        $scope.offTheMark = true;
    };

    $scope.checkAnswer = function() {
        $scope.answerChecked = true;
        allCorrect = true;
        angular.forEach($scope.questionGroup.question, function(question) {
           question.answerCorrect = (question.givenAnswerId == question.questionItems.item[2].answers.answer._answerid);
           allCorrect = allCorrect && question.answerCorrect ;      
        });
        if (allCorrect) {
            $scope.playClip("content/shared_assets/audio/applause")
        } else {
            $scope.playClip("content/shared_assets/audio/wrong")
            $scope.tryAgainEnabled = true;
        }
    };

    $scope.tryAgain = function() {
        //unset false answers
         console.log('unsetting anwer');
         angular.forEach($scope.questionGroup.question, function(question) {
           if (!question.answerCorrect) {
                console.log('unsetting anwer');
                question.givenAnswer = '     ';
                question.givenAnswerId = 0;
                question.answerGiven = false;
                $scope.notComplete = true;
           }
        });
    }

    $scope.reset = function() {
        DataSource.get(SOURCE_FILE,setData,xmlTransform);
    }
        
    DataSource.get(SOURCE_FILE,setData,xmlTransform);
    
};