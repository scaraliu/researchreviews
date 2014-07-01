//interactions
var app = angular.module('researcher_app', ['ui.bootstrap']);
var currPaperKey = -1; 

app.controller('sort_controller', function($scope) {
});

app.controller('main_controller', function($scope, $http, $modal, $window) {
  $scope.addPaper = function() {
    console.log("add Paper button");
    var modalInstance = $modal.open({
      templateUrl: 'addPaperTemplate.html',
      windowClass:'normal',
      controller: addPaperCtrl,
      backdrop: 'static'
    });
  };

  $scope.addVersion = function() {
    console.log("add Version button");
    var modalInstance = $modal.open({
      templateUrl: 'addVersionTemplate.html',
      windowClass:'normal',
      controller: addPaperCtrl,
      backdrop: 'static'
    });
  };
}); 

function ab2str(buf) {
  return String.fromCharCode.apply(null, new Uint8Array(buf));
}

function str2ab(str) {
  var buf = new ArrayBuffer(str.length*2); // 2 bytes for each char
  var bufView = new Uint8Array(buf);
  for (var i=0, strLen=str.length; i<strLen; i++) {
    bufView[i] = str.charCodeAt(i);
  }
  return buf;
}

var addPaperCtrl = function ($scope, $modalInstance) {
  $scope.upload = function () {
    var files = document.getElementById("addFile").files;
    var comments = document.getElementById("add-paper-comments").value;

    //console.log("aohsdfashdfkjhasdfhasdlfjalsdf" + document.getElementById("paper-view-container").getElementsByTagName("p")[0].innerHTML);
    
    if (files.length < 1) {
      alert("No files found.");
      return;
    }

    uploadFile(files, comments);

    $modalInstance.dismiss('cancel');
  };

  $scope.cancel = function () {
    $modalInstance.dismiss('cancel');
  };
};

function uploadFile(files, comments) {
  var newPaper = files[0];
  var reader = new FileReader();
  var key = Math.random() + "";

  reader.onload = function() {
    var arrayBuffer = reader.result;
    var today = new Date();  

    console.log("coajfoiasjdfoijsda: " + comments);

    console.log("emit add paper");
    window.freedom.emit('add-paper', {
      title: newPaper.name,
      date: today,
      key: key,
      comments: comments, 
      binaryString: ab2str(arrayBuffer)
    });
  }
  reader.readAsArrayBuffer(newPaper);

  window.freedom.emit('show-paper', key);
}

function downloadPaper(key) {
  console.log("key " + key);
  window.freedom.emit('download-paper', {paperkey: key});
}


window.freedom.on('got-paper', function(data){
  console.log("got paper "); //data is string
  var ab = str2ab(data);

  var reader = new FileReader();


  var blob = new Blob([ab], {type:'application/pdf'});
  reader.readAsArrayBuffer(blob);
saveAs(blob, "downloadstuff"); 
});

function makeRow(title, date, key) {
  return '<th onclick="freedom.emit(\'show-paper\',' + key + ')"><a onclick="downloadPaper(' + key + ')"">' + title + '</a> by John Doe on ' + date + '</th>'; 
}

window.freedom.on('display-papers', function(data) {
  console.log('display papers ' + data.length); 
  var paper_table = document.getElementById('paper-table');

  for (var i = paper_table.rows.length; i < data.length; i++){
    var p = document.createElement('tr'); 
    p.innerHTML = makeRow(data[i].title, data[i].date, data[i].key); 
    paper_table.appendChild(p);
  }
}); 

window.freedom.on('show-paper-view', function(data) {
  currPaperKey = data.key; 
  console.log("show paper view " + data.title + " " + currPaperKey);
  var paper_view = document.getElementById("paper-view-container");
  paper_view.getElementsByTagName("h1")[0].innerHTML = data.title;
  paper_view.getElementsByTagName("p")[0].innerHTML = data.comments; 
});

function login() {
  var username = document.getElementById("username").value;
  var password = document.getElementById("password").value;
  console.log(username + " " + password);

  document.cookie = "username="+username; 
  window.location.href = "papers.html";
}

window.onload = function() {
  if(window.location.pathname === "/static/papers.html" || window.location.pathname === "/static/browse.html") {
    console.log("page path is " + window.location.pathname);
    window.freedom.emit('load-papers', 0); 
  }
  if(window.location.pathname === "/static/papers.html") {
    freedom.emit('show-paper', -1); 
  }
} 