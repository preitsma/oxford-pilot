/**
 *  Created by Fresh Design Studio
 *  Date: 31/3/14
 *  (c) 2010-2014 Plance, http://fresh-design.com.ua
 */

var dialogueEntity;

angular.module('orderDialogue',['ngSanitize','ngDragDrop'])
  .factory('Dialogues',
    ['$http', function($http) { //factory to fetch the content
      return {
        getDialogue: function(file,callback, transform){
          $http.get(
              file,
              {transformResponse:transform}
          ).
          success(function(data, status) {
            setData(data);
          }).
          error(function(data, status) {
              alert('Something went wrong parsing ' + file);
          });
        },
        resetDialogue: function(){
          return angular.copy(dialogueEntity);
        }
      };
    }])
  .factory('XmlToJson', function() {
    var x2js = new X2JS();

    return {
      convert: function(data) {
        return x2js.xml_str2json(data);
      }
    }
  })

/*
GLOBAL APP CONTROLLER
*/
.controller('GameController',
  ['$scope', 'Dialogues', 'XmlToJson', function($scope, Dialogues, XmlToJson){

    /*
      MAIN APP VARIABLES
    */
    var SOUND_PATH = "content/shared_assets/audio/";
    var SOURCE_FILE = "content/xml/content.xml";

    $scope.start;

    /*
      GET APP DATA
    */

    setData = function(data){
      /*GETTING LIST OF ALL AVAILABLE OPTIONS*/
      var elements = data.compositequiz.quizzes.quiz.options.option;
      var ids = data.compositequiz.quizzes.quiz.questionGroup.question;
      var title = data.compositequiz.quizzes.quiz.rubric;

      var id_list = Array();

      for(key in ids){
        id_list[ids[key].questionItems.item.answers.answer["_answerid"]-1] = key;
      }

      angular.forEach(elements, function(option,index) {
         option.enabled = true;
         option.text = option["__cdata"];
         option.id = id_list[index];
      });

      dialogueEntity = elements;
      $scope.dialogues = angular.copy(dialogueEntity);

      $scope.title = title["__cdata"];

      $('#loading').fadeOut(800);
    }

    $scope.onDrop = function(e, b, index) {
        //restore the option that have been removed by d&d module
        insertItem($scope.start, index);
    }

    $scope.onStart = function(e, b, index) {
        //restore the option that have been removed by d&d module
        $scope.start = index;
    }

    $scope.reset = function(){
      if(typeof($scope.dialogues)!=="undefined") {
        $scope.playFile(null,null,'click_low');
        $scope.dialogues = Dialogues.resetDialogue();
      }
      else {
        Dialogues.getDialogue(SOURCE_FILE,setData, XmlToJson.convert);
      }

      $scope.isStarted = false;
      $scope.isChecked = false;
      $scope.allAnswersShown = false;
    };

    /*
      WORKING WITH SOUNDS - PRELOADING SAMPLES
    */
    $scope.sounds = [];
    $scope.playing = false;

    initSound = function(fileName) {
      return new buzz.sound(fileName.replace(/\.[^/.]+$/, ""), {
        formats: ["ogg", "mp3"]
      })
      .bind("ended", function(e) { $scope.playing = false; })
      .load();
    }

    cacheSound = function(fileName) {
      $scope.sounds[fileName] = initSound(SOUND_PATH + fileName);
    }

    cacheSound('click_low');
    cacheSound('harp');
    cacheSound('wrong');

    $scope.playFile = function(a,b,name) {
      $scope.playSound($scope.sounds[name]);
    }

    $scope.playSound = function(sound) {
       if($scope.playing == false) {
        $scope.playing = true;
        sound.play();
       }
    }


    function insertItem(firstIndex, secondIndex) {
      
      $scope.isStarted = true; 

      var placeMent = angular.copy($scope.dialogues[firstIndex]);
      var backup;
      if (secondIndex < firstIndex) {
            for ( var i = secondIndex ; i <= firstIndex; i++) {
                if ( !$scope.dialogues[i].isCorrect ) {
                    backup = angular.copy($scope.dialogues[i]);

                    $scope.dialogues[i] = placeMent;
                    placeMent = backup;
                }
            }
      } else {
            for ( var i = secondIndex ; i >= firstIndex; i--) {
                //console.log(i);
                if ( !$scope.dialogues[i].isCorrect ) {
                  backup = angular.copy($scope.dialogues[i]);
                  $scope.dialogues[i] = placeMent;
                  placeMent = backup;
                }
            }
      }   
    }
    
    function getFirstUncheckedDialogueIndex() {
      var result;

      angular.forEach($scope.dialogues, function(dialogue, index) {
        if(result == null && dialogue.isCorrect == null) {
          result = index;
        }
      });

      return result;
    }

    function getDialogueIndexById(id) {
      var result;

      angular.forEach($scope.dialogues, function(dialogue, index) {
        if(result == null && dialogue.id == id){
          result = index;
        }
      });
      return result;
    }

    function swapDialoguesByIndexes(firstIndex, secondIndex) {
      $scope.isStarted = true; 

      var tmp = angular.copy($scope.dialogues[firstIndex]);
      $scope.dialogues[firstIndex] = angular.copy($scope.dialogues[secondIndex]);
      $scope.dialogues[secondIndex] = tmp;
    }

    $scope.checkAnswers = function(){
      $scope.isChecked = true;
      var numcorrect = 0;
      angular.forEach($scope.dialogues, function(dialogue, index){
        var result = (dialogue.id == index);
        dialogue.isCorrect = result;
        if(result) numcorrect++;
      });

      var totalAnswers = $scope.dialogues.length;
      if(numcorrect == totalAnswers) $scope.allAnswersShown = true;

      /*IF NOT ALL OF THE ANSWERS ARE CORRECT - PLAY WRONG SOUND*/
      if(numcorrect<totalAnswers){
        $scope.playFile(null,null,'wrong');
      }
      else {
        /*OTHERWISE (NUMBER OF CORRECT = TOTAL NUMBER) - PLAY HARP*/
        $scope.playFile(null,null,'harp');
      }
    };

    $scope.tryAgain = function(){
      $scope.playFile(null, null, 'click_low');
      $scope.isChecked = false;
      $scope.isStarted = false;

      angular.forEach($scope.dialogues, function(dialogue, index){
        if(dialogue.isCorrect) {
          index = dialogue.id;
        }
        else {
          dialogue.isCorrect = null;
        }
      });
    };

    $scope.seeNextAnswer = function(){
      $scope.playFile(null,null,'click_low');
      $scope.isStarted = true;
      var firstUncheckedIndex = getFirstUncheckedDialogueIndex();

      if (firstUncheckedIndex >= 0 && firstUncheckedIndex < $scope.dialogues.length-1) {
        swapDialoguesByIndexes(firstUncheckedIndex, getDialogueIndexById(firstUncheckedIndex));
        $scope.dialogues[firstUncheckedIndex].isCorrect = true;
      }
      else {
        $scope.dialogues[firstUncheckedIndex].isCorrect = true;
        $scope.allAnswersShown = true;
      }
    };

    $scope.seeAllAnswers = function(){
      $scope.playFile(null,null,'click_low');
       angular.forEach($scope.dialogues, function(dialogue, index) {
        $scope.seeNextAnswer();
      });
      $scope.isStarted = true;
    };

    $scope.score = function() {
      var curScore = "";
      if(typeof($scope.dialogues)!=="undefined"){
         curScore =  $scope.dialogues.reduce(function(mem, dialogue) {
          var score = (dialogue.isCorrect === true) ? 1 : 0;
          return mem + score;
        }, 0);
      }
      return curScore;
    };

    $scope.reset();

}]);
