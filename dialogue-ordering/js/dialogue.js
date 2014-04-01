/**
 *  Created by Fresh Design Studio
 *  Date: 31/3/14
 *  (c) 2010-2014 Plance, http://fresh-design.com.ua
 */

//prevent errors in IE
window.console = window.console || {};
window.console.log = window.console.log || function() {};

var fixedElements;
var dialogueEntity;

 /*
  PRELOADING DATA
*/
xmlTransform = function(data) {
    var x2js = new X2JS();
    var json = x2js.xml_str2json( data );
    return json;
};


angular.module('orderDialogue',['ngSanitize','ngDragDrop'])
  .factory('Dialogues', 
    ['$http',function($http){ //factory to fetch the content
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

/*
GLOBAL APP CONTROLLER
*/
.controller('GameController', function($scope, Dialogues, $filter){

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
      
      var id_list = Array();

      for(key in ids){
        id_list[ids[key].questionItems.item.answers.answer["_answerid"]-1] = key;
      }
      
      angular.forEach(elements, function(option,index) {
         option.enabled = true;
         option.text = option["__cdata"];
         option.id = id_list[index];
         //option.id = 
      });
/*
      angular.forEach(ids, function(elem,index) {
         elem.id = elem.questionItems.item.answers.answer["_answerid"]-1;
         elem.text = elements[elem.id]["__cdata"];
         elem.enabled = true;
      });
      console.log(ids);
*/
      dialogueEntity = elements;
      $scope.dialogues = angular.copy(dialogueEntity);
    }

    $scope.onDrop = function(e, b, index) {
        //restore the option that have been removed by d&d module
        console.log('drop:' + index);
        swapDialoguesByIndexes($scope.start, index);

    }

    $scope.onStart = function(e, b, index) {
        $scope.start = index;
        //restore the option that have been removed by d&d module
        console.log('start: ' + index);
    }

    $scope.reset = function(){
      if(typeof($scope.dialogues)!=="undefined"){
        $scope.playFile(null,null,'click_low');
        $scope.dialogues = Dialogues.resetDialogue();
      }else {
        Dialogues.getDialogue(SOURCE_FILE,setData,xmlTransform);
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
                    formats: [ "mp3"]
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
       if ($scope.playing == false) {
            $scope.playing = true;  
            sound.play();
       }
    }
  

    function getFirstIncorrectDialogueIndex() {
      var result;

      angular.forEach($scope.dialogues, function(dialogue, index) {
        if(result == null && dialogue.id != index){
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

      console.log('swapping ' + tmp.text);

      $scope.dialogues[firstIndex] = angular.copy($scope.dialogues[secondIndex]);
      
      console.log('with ' + $scope.dialogues[secondIndex].text);
      $scope.dialogues[secondIndex] = tmp;
    }

    $scope.sortableOptions = {
      update: function(e, ui) {        
        $scope.isStarted = true;
        if (ui.item.scope().dialogue.isCorrect == true) {
          ui.item.sortable.disabled = true;
        }
         /* for(i in fixedElements){
          var newElement = $scope.dialogues[i];
          console.log($scope.dialogues);
          oldElement = fixedElements[i];
          var newPos = -1;
          angular.forEach($scope.dialogues, function(dialogue, index) {
            if(dialogue.id === oldElement.id){
              newPos = oldElement.id;
              console.log(i+" "+dialogue.text);
            }
          });
          console.log(newPos+" "+i);
          swapDialoguesByIndexes(newPos,i);
        }*/
      },

     /* start: function(){
        fixedElements = Array();
        var i = 0;
         angular.forEach($scope.dialogues, function(dialogue, index){
          if(dialogue.isCorrect == true){
            i++;
            fixedElements[index]=dialogue;
          };
        });
      },*/
      containment: ".phrases",
      placeholder: "placeholder",
      items: "li:not(.unsortable)",
      cancel: ".unsortable, .fixed"
    };

    $scope.checkAnswers = function(){
      $scope.isChecked = true;
      var numcorrect = 0;
      angular.forEach($scope.dialogues, function(dialogue, index){
        var result = (dialogue.id == index);
        dialogue.isCorrect = result;
        if(result)numcorrect++;
      });
      var totalAnswers = $scope.dialogues.length;
      /*IF NOT ALL OF THE ANSWERS ARE CORRECT - PLAY WRONG SOUND*/
      if(numcorrect<totalAnswers){
        $scope.playFile(null,null,'wrong');
      }else {
        /*OTHERWISE (NUMBER OF CORRECT = TOTAL NUMBER) - PLAY HARP*/
        $scope.playFile(null,null,'harp');
      }
    };

    $scope.tryAgain = function(){
      $scope.playFile(null,null,'click_low');
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


    var cnt = 0;

    $scope.seeNextAnswer = function(){
      // $scope.isStarted = true;

      // if(cnt < $scope.dialogues.length) {
      //   $scope.predicate = function(dialogue) {
      //     if(dialogue.id < cnt) return dialogue.id;
      //     else return ($scope.dialogues.length + 1);
      //   };
      //   cnt++;        
      //   console.log(cnt);
      // }

      // else {
      //   $scope.allAnswersShown = true;
      //   console.log("end!");
      //   console.log($scope.dialogues);        
      // }
      $scope.playFile(null,null,'click_low');
      $scope.isStarted = true;
      var firstIncorrectIndex = getFirstIncorrectDialogueIndex();

      if (firstIncorrectIndex >= 0) {
        swapDialoguesByIndexes(firstIncorrectIndex, getDialogueIndexById(firstIncorrectIndex));
        $scope.dialogues[firstIncorrectIndex].isCorrect = true;

      } else {
        $scope.allAnswersShown = true;
      }
    };

    $scope.seeAllAnswers = function(){
      $scope.playFile(null,null,'click_low');
      $scope.predicate='id';
      $scope.allAnswersShown = true;
      $scope.isStarted = true;
    };

    $scope.score = function() {
      if ($scope.dialogues) {

        var curScore =  $scope.dialogues.reduce(function(mem, dialogue) {
          var score = (dialogue.isCorrect == true) ? 1 : 0;
          return mem + score;
        }, 0);
        if(curScore==0)return "";
        else return curScore;
      }
    };

    $scope.reset();
    
  });
