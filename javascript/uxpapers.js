app.controller('papersController', function($scope, $modal, $location, $filter) {
  if($location.search().username && $location.search().username !== username) { //soemone else's
    console.log("don't change anything");
  }
  else {
    $scope.$watch('papers', function(){
        window.freedom.emit('set-papers', $scope.papers);
    }, true);
  }

$("table:first").find("tr:first").addClass('info');
$('table').on('click','tr',function(e){
  $('table').find('tr.info').removeClass('info');
  $(this).addClass('info');
});


  //for paperTable
  $scope.papers = [];

  $scope.showNav = true; 
  //for paperView
  $scope.currPaper;

  //for moving between versions
  $scope.currVnum = 1;

  //for looking at someone else's papers
  $scope.accessBtn = true;
  $scope.accessAddBtn = true;   

  $scope.isopen = false; 

  var orderBy = $filter('orderBy');

  $scope.order = 'versions[versions.length-1].title'; 

  $scope.setOrder = function(order) {
    $scope.order = order; 
  }  

  $scope.displayVersion = function(offset) {
    $scope.currVnum = $scope.currVnum + offset;
    $scope.showPaperView();
  }; 

  $scope.addReview = function() {
    if($location.search().username && $location.search().username !== username) { 
      //check user access before they review this paper version
      var version = $scope.papers[$scope.viewKey].versions[$scope.currVnum-1]; 
      if(version.privateSetting && version.viewList.indexOf(username) === -1){
        alert("You do not have permission to review this paper.");
        return; 
      }
    } 
    var msg = {
      title: $scope.papers[$scope.viewKey].versions[$scope.currVnum-1].title,
      pkey: $scope.viewKey,
      author: $location.search().username,
      vnum: $scope.currVnum-1,
      rkey: Math.random() + ""
    }; 
    window.freedom.emit('add-review', msg);
    window.freedom.on('go-to-reviews', function(data) {
      $location.path('reviewspage');  
    }); 
  }; 

  var loadPapersPage = function() {
    if($location.search().username && $location.search().username !== username) { //load someone else's papers 
      window.freedom.emit('get-other-papers', {
        to: $location.search().username, 
        from: username 
      }); 
      window.freedom.on('display-other-papers', function(papers) {
        for(var key in papers) {
          $scope.papers.push(papers[key]); 
        } 
        $scope.accessAddBtn = false; 
        $scope.$apply(); 
      });
    }
    else { //load own papers
      window.freedom.emit('get-papers'); 
      window.freedom.on('display-papers', function(papers) {
        $scope.papers = []; 

        for(var i = 0; i < papers.length; i++) {
          var newPaper = new Paper(papers[i]);
          $scope.papers.push(newPaper);
        }

        if($scope.papers.length > 0) {
          $scope.currPaper = $scope.papers[0];
          $scope.showPaperView();
        }
        $scope.$apply(); 
      }); 
    }
  };  

  loadPapersPage(); 
  if ($scope.papers.length > 0) $('table').children('tr:first').addClass('info');

  $scope.showPaperView = function(key) {
    //LOAD PAPER VIEW
    if($scope.papers.length === 0) 
      return; 
    if(!$scope.currPaper) {
      $scope.currPaper = $scope.papers[0]; 
      $scope.currVnum = $scope.papers[0].versions.length;
    }

    if(key) {
      for(var i = 0; i < $scope.papers.length; i++) 
        if($scope.papers[i].pkey === key) {
          $scope.currPaper = $scope.papers[i];
          break; 
        }
      }
    //LOAD REVIEWS
    getReviews();
 }; 

  var getReviews = function(currPaper){
 // $scope.$apply();
  if(currPaper) $scope.currPaper = currPaper;
  if (!$scope.currPaper) return;
  var reviews = $scope.currPaper.versions[$scope.currVnum-1].reviews;
    if(reviews) {
      for(var i = 0; i < reviews.length; i++) {
        var msg = {
          pkey: $scope.currPaper.pkey,
          rkey: reviews[i].rkey,
          reviewer: reviews[i].reviewer,
          vnum: $scope.currVnum-1,
          from: username 
        };  

        msg.author = $location.search().username? $location.search().username : username;
        if($location.search().username && $location.search().username !== username) 
          window.freedom.emit('get-other-paper-review', msg);
        else 
          window.freedom.emit('get-paper-review', msg); 
      }
      if($location.search().username && $location.search().username !== username)  //load someone else's paper's reviews 
        $scope.accessBtn = false;
      window.freedom.on('got-paper-review', function(data){
        var version = $scope.currPaper.versions[$scope.currVnum-1];
        if(!version.reviews) version.reviews=[];
        for (var i = 0; i < version.reviews.length; i++){
          if (version.reviews[i].reviewer === data.reviewer){
            version.reviews[i] = new Review(data.review);
            console.log("REVIEW HERE " + JSON.stringify(data.review));
            $scope.$apply();
           break;
          }
        }
      });
    }
 }

  $scope.addVersion = function() {
    var modalInstance = $modal.open({
      templateUrl: '/modals/addVersionTemplate.html',
      windowClass:'normal',
      controller: addVersionCtrl,
      backdrop: 'static', 
      resolve: {
        paper: function() {
          return $scope.currPaper; 
        },
        vnum : function(){
          return $scope.currVnum;
        }
      }
    }); 
  };

  $scope.addPaper = function() {
    var modalInstance = $modal.open({
      templateUrl: '/modals/addPaperTemplate.html',
      windowClass:'normal',
      controller: addPaperCtrl,
      backdrop: 'static', 
      resolve:{
        papers: function(){
          return $scope.papers;
        },
        currPaper: function(){
          return $scope.currPaper;
        }
      }
    }); 
  };

  $scope.editPrivacy = function() {
    var modalInstance = $modal.open({
      templateUrl: '/modals/editPrivacyTemplate.html',
      windowClass:'normal',
      controller: editPrivacyCtrl,
      backdrop: 'static', 
      resolve: {
        currVersion: function() {
          return $scope.currPaper.versions[$scope.currVnum-1];
        }
      }
    });   
  }

  $scope.inviteReviewers = function() {
    var modalInstance = $modal.open({
      templateUrl: '/modals/inviteReviewersTemplate.html',
      windowClass:'normal',
      controller: inviteReviewersCtrl,
      backdrop: 'static', 
      resolve: {
        currPaper : function() {
          return $scope.currPaper;
        },
        vnum :function() {
          return $scope.currVnum-1;
        }
      }
    }); 
  };

  var editPrivacyCtrl = function ($scope, $modalInstance, currVersion) {
    $scope.alertList = [];
    $scope.viewList = []; 

    for (var i = 0; i < currVersion.alertList.length; i++){
      $scope.alertList.push(currVersion.alertList[i]);
    }
    for(var i = 0; i < currVersion.viewList.length; i++) 
      $scope.viewList.push(currVersion.viewList[i]);
    
    //$scope.alertList = currVersion.alertList;
    //$scope.viewList = currVersion.viewList;

    $scope.currSetting = currVersion.privateSetting? "private" : "public";
    $scope.currComments = currVersion.comments; 
    $scope.currTitle = currVersion.title; 
  
    $scope.save = function () { 
      currVersion.editComments(document.getElementById('comments').value)
      currVersion.editTitle(document.getElementById('title').value);

      if($("#addPaperPublic2").is(':checked')){
        currVersion.editPrivacy(true);
      }
      else if($('#addPaperPrivate2').is(':checked')) { //public to private  && !privateSetting
        currVersion.editPrivacy(false);
      }

      $modalInstance.dismiss('cancel');
    };

    $scope.cancel = function () {
      $modalInstance.dismiss('cancel');
    };
  };

  var addPaperCtrl = function ($scope, $modalInstance, papers, currPaper) {
    $scope.states = userList;

    var uidx = userList.indexOf(username);
    if (uidx > -1) $scope.states.splice(uidx, 1);
    //TODO: userlist should not include already reviewers? should somehow show which people have already reviewed to prevent duplicate reviews?
    $scope.privacyHeading = "Invite reviewers.";
    $scope.privatePaper = false;
    $scope.selected = undefined;
    $scope.alerts = [];
    $scope.checkList = []; 
    $scope.setPrivate = function(){
      $scope.privatePaper = true;
    };

    $scope.setPublic = function(){
      $scope.privatePaper = false;
    };

    $scope.deleteUser = function(id) {
      var idx = $scope.checkList.indexOf($scope.alerts[id]);
      if(idx > -1) 
        $scope.checkList.splice(idx, 1); 

      $scope.alerts.splice(id, 1);
    };

    $scope.selectMatch = function(selection) {
      $scope.alerts.push(selection);
    };

    $scope.checkAlert = function(username) {
    console.log(username + " has been checked" );
      var idx = $scope.checkList.indexOf(username); 
      if (idx > -1) $scope.checkList.splice(idx, 1);
      else $scope.checkList.push(username);
    }; 

    $scope.upload = function () {
      var files = document.getElementById("addFile").files;
      if (files.length < 1) {
        alert("No files found.");
        return;
      }

      var title = document.getElementById("add-paper-title").value;

      if (!title) title = "Untitled"

      var comments = document.getElementById("add-paper-comments").value;
      var alertList = [];
      for(var i = 0; i < $scope.alerts.length; i++) 
        alertList.push($scope.alerts[i]); 
      

      console.log("CHECK LIST " + JSON.stringify($scope.checkList));
      var viewList;
      if(!$scope.privatePaper) { //publicly shared
        viewList = false; 
      }
      else { //privately shared
        viewList = alertList; 
        console.log("ALERT LIST " + JSON.stringify($scope.checkList));
        alertList = $scope.checkList; 
      }
       var newPaper = new Paper();
     
      var vdata = {
        vnum: 0,
        pkey: newPaper.pkey,
        title: title,
        author: username,
        comments: comments,
        viewList: viewList,
        alertList: alertList,
        privateSetting: $scope.privatePaper, 
      };

      var ver = new Version(vdata);
      ver.uploadPDF(files[0]);

      newPaper.addVersion(ver);
      papers.push(newPaper);  
      currPaper = newPaper;
      ver.shareVersion();
      $modalInstance.dismiss('cancel');
    };

    $scope.cancel = function () {
      $modalInstance.dismiss('cancel');
    };
  };

  var inviteReviewersCtrl = function ($scope, $modalInstance, currPaper, vnum) {
    $scope.states = userList; 
    var uidx = userList.indexOf(username);
    if (uidx > -1) $scope.states.splice(uidx, 1);
 
    $scope.selected = undefined;
    $scope.alerts = [];
    $scope.privateSetting = currPaper.versions[vnum].privateSetting;
    $scope.privacyHeading = $scope.privateSetting? "Select users to view this paper" : "Invite reviewers"; 
 
    $scope.checkList = []; 
    
    $scope.selectMatch = function(selection) {
      $scope.alerts.push(selection);
      $scope.selected = '';
    }; 

    $scope.deleteUser = function(id) {
      var idx = $scope.checkList.indexOf($scope.alerts[id]);
      if(idx > -1) 
        $scope.checkList.splice(idx, 1); 
      $scope.alerts.splice(id, 1);
    };
    $scope.checkAlert = function(username) {
      var idx = $scope.checkList.indexOf(username); 
      if (idx > -1) $scope.checkList.splice(idx, 1);
      else $scope.checkList.push(username);
    }; 

    $scope.accept = function () {
      if ($scope.privateSetting){
        currPaper.versions[vnum].alertList = $scope.checkList;
        currPaper.versions[vnum].viewList = $scope.alerts;
      }
      else{
        currPaper.versions[vnum].alertList = $scope.alerts;
        currPaper.versions[vnum].viewList = false;
      }
      currPaper.versions[vnum].shareVersion();
      $modalInstance.dismiss('cancel');
    };
    $scope.cancel = function () {
      $modalInstance.dismiss('cancel');
    };
  };

  var addVersionCtrl = function ($scope, $modalInstance, paper, vnum) {
    $scope.states = userList; 
    var uidx = userList.indexOf(username);
    if (uidx > -1) $scope.states.splice(uidx, 1);
 
    $scope.privacyHeading = "Invite reviewers.";
    $scope.privatePaper = false;
    $scope.selected = undefined;
    $scope.alerts = [];
    $scope.checkList = []; 

    $scope.setPrivate = function(){
      $scope.privatePaper = true;
    };

    $scope.setPublic = function(){
      $scope.privatePaper = false;
    };

    $scope.deleteUser = function(id) {
      var idx = $scope.checkList.indexOf($scope.alerts[id]);
      if(idx > -1) $scope.checkList.splice(idx, 1); 
      $scope.alerts.splice(id, 1);
    };

    $scope.selectMatch = function(selection) {
      $scope.alerts.push(selection);
    };

    $scope.checkAlert = function(username) {
      var idx = $scope.checkList.indexOf(username); 

      if (idx > -1) $scope.checkList.splice(idx, 1);
      else $scope.checkList.push(username);
    }; 

    $scope.upload = function () {
      var files = document.getElementById("addFile").files;
      var comments = document.getElementById("add-version-comments").value;
      var vtitle = document.getElementById("version-title").value;
      if (!vtitle) vtitle = "Untitled";
      
      if (files.length < 1) {
        alert("No files found.");
        return;
      }
      
      var alertList = [];
      for (var i = 0; i < $scope.alerts.length; i++)
        alertList.push($scope.alerts[i]);
      
      var viewList;
      if(!$scope.privatePaper) { //publicly shared
        viewList = false; 
      }
      else { //privately shared
        viewList = alertList;
        alertList = $scope.checkList; 
      }

      var vdata = {
        vnum: vnum,
        pkey: paper.pkey,
        title: vtitle,
        author: username,
        comments: comments,
        viewList: viewList,
        alertList: alertList,
        privateSetting: $scope.privatePaper
      };

      var ver = new Version(vdata);
      ver.uploadPDF(files[0]);

      paper.addVersion(ver);
      ver.shareVersion();
      $modalInstance.dismiss('cancel');
    };

    $scope.cancel = function () {
      $modalInstance.dismiss('cancel');
    };
  };

  $scope.deleteVersion = function() {
    console.log("**" + JSON.stringify($scope.currPaper) + " ... " + $scope.currVnum);
    $scope.privateSetting = $scope.currPaper.versions[$scope.currVnum-1].privateSetting; 
    $scope.viewList = $scope.currPaper.versions[$scope.currVnum-1].viewList; 
    $scope.currPaper.deleteVersion(--$scope.currVnum);

    if($scope.currPaper.versions.length === 0) { //deleted last version
      for(var i = 0; i < $scope.papers.length; i++)
        if($scope.papers[i].pkey === $scope.currPaper.pkey) {
          $scope.papers.splice(i, 1); 
          break; 
        }  
      //send to public storage
      if (!$scope.privateSetting) {
        var delMsg = {
          pkey: $scope.currPaper.pkey,
          vnum: $scope.currVnum
        };
        window.freedom.emit('delete-paper', delMsg);
      }
      //delete from acl's private-papers
      if($scope.privateSetting) {
        for(var i = 0; i < $scope.viewList.length; i++) {
          var delMsg = {
            pkey: $scope.currPaper.pkey,
            vnum: $scope.currVnum,
            to: $scope.viewList[i]
          };
          console.log("**DEL MSG IN UXPAPERS " + JSON.stringify(delMsg));
          window.freedom.emit('delete-private-paper', delMsg);
        }
      }

      $scope.currPaper = $scope.papers.length>0? $scope.papers[0] : false; 
      if($scope.currVnum < 1) $scope.currVnum = 1; 
    }
  };

  $scope.downloadVersion = function () {
    if($location.search().username && $location.search().username !== username) { 
      //check user access before they download someone else's paper version 
      var version = $scope.papers[$scope.viewKey].versions[$scope.currVnum-1]; 
      if(version.privateSetting && version.viewList.indexOf(username) == -1){
        alert("You do not have access to this version of the paper.");
        return; 
      }
    }

    $scope.currPaper.versions[$scope.currVnum-1].download();
  }
});
