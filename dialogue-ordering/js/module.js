
var fixedElements;

angular.module('orderDialogue', ['ngSanitize','ngDragDrop'])
  .factory('Dialogues', function(){
    var dialogue = [
      {
        id: 5,
        text: "<b>Jilly:</b> On Saturday at two oâ€™clock. Could you ask him to call me back, please?",
        enabled: true
      },
      {
        id: 3,
        text: "<b>Jilly:</b> Yes, please. Could you tell him Iâ€™m going to a show at the Space Centre. Would he like to come?",
        enabled: true
      },
      {
        id: 6,
        text: "<b>Mrs Victory:</b> OK, Iâ€™ll tell him.",
        enabled: true
      },
      {
        id: 0,
        text: "<b>Mrs Victory:</b> Hello.",
        enabled: true
      },
      {
        id: 7,
        text: "<b>Jilly:</b> Thanks, Mrs Victory. Bye!",
        enabled: true
      },
      {
        id: 8,
        text: "<b>Mrs Victory:</b> Youâ€™re welcome. Bye, Jilly!",
        enabled: true
      },
      {
        id: 2,
        text: "<b>Mrs Victory:</b> No, Iâ€™m afraid heâ€™s not here. Heâ€™s at the park. Can I take a message?",
        enabled: true
      },
      {
        id: 1,
        text: "<b>Jilly:</b> Oh, hello Mrs Victory. Itâ€™s Jilly here. Can I speak to William, please?",
        enabled: true
      },
      {
        id: 4,
        text: "<b>Mrs Victory:</b> Right. When are you going?",
        enabled: true
      },
      {
        id: 9,
        text: "<b>Mrs Victory:</b> Test",
        enabled: true
      }
    ];

    return {
      getDialogue: function(){
        return angular.copy(dialogue);
      }
    };
  })

  .controller('GameController', function($scope, Dialogues, $filter){

    function getFirstIncorrectDialogueIndex() {
      var result;

      angular.forEach($scope.dialogues, function(dialogue, index) {
        if(result == null && dialogue.id !== index){
          result = index;
        }

      });

      return result;
    }

    function getDialogueIndexById(id) {
      var result;

      angular.forEach($scope.dialogues, function(dialogue, index) {
        if(result == null && dialogue.id === id){
          result = index;
        }
      });
      return result;
    }

    function swapDialoguesByIndexes(firstIndex, secondIndex) {
      var tmp = $scope.dialogues[firstIndex];
      $scope.dialogues[firstIndex] = $scope.dialogues[secondIndex];
      // $scope.dialogues[firstIndex].isCorrect = true;
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
      angular.forEach($scope.dialogues, function(dialogue, index){
        dialogue.isCorrect = (dialogue.id === index);
      });
    };

    $scope.tryAgain = function(){
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

    $scope.reset = function(){
      $scope.dialogues = Dialogues.getDialogue();
      $scope.isStarted = false;
      $scope.isChecked = false;
      $scope.allAnswersShown = false;
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
      $scope.predicate='id';
      $scope.allAnswersShown = true;
      $scope.isStarted = true;
    };

    $scope.score = function() {
      //if ($scope.isChecked) {
        var curScore =  $scope.dialogues.reduce(function(mem, dialogue) {
          var score = (dialogue.isCorrect === true) ? 1 : 0;
          return mem + score;
        }, 0);
        if(curScore==0)return "";
        else return curScore;
      //}
    };

    $scope.reset();
  });
