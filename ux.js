//interactions
var app = angular.module('researcher_app', ['ui.bootstrap']);


app.controller('sort_controller', function($scope) {

});

app.controller('main_controller', function($scope, $http, $modal, $window) {
  /*$scope.deletePaper = function(paper, index) {
    window.freedom.emit('delete_paper', {
      title : paper.title
    });
    var index = this.row.rowIndex;
    $scope.myPapers.splice(index, 1);
  }*/ 

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


var FileRead = {
  onLoad: function(file, evt) {
    console.log("File Read Done");
    // Send data to be served. Expect a 'serve-url' response with our descriptor
    var key = Math.random() + "";
    window.freedom.emit('serve-data', {
      key: key,
      value: evt.target.result,
      name: file.name
    });
  } 
};

var addPaperCtrl = function ($scope, $modalInstance) {
  $scope.upload = function () {
    var files = document.getElementById("addFile").files;
    
    if (files.length < 1) {
      alert("No files found.");
      return;
    }

    var file = files[0];
    var reader = new FileReader();
    console.log("Dropped a file. Let's start reading " + file);
    reader.onload = FileRead.onLoad.bind({}, file);
    reader.readAsArrayBuffer(file);

    $modalInstance.dismiss('cancel');
  };

  $scope.cancel = function () {
    $modalInstance.dismiss('cancel');
  };
};

function makeRow(url, title) {
  console.log(url + " " + title);
  return "<th><a href=" + url + " target='_blank'>" + title + "</a> by John Doe on 1/1/2014</th>"; 
}

window.freedom.on('download-data', function(val) {
  console.log("Download complete"); 
  var blob = new Blob([val]);

  if (window.rr_name) {
    saveAs(blob, window.rr_name);
  } else {
    saveAs(blob, 'unnamed');
  }
});

window.freedom.on('serve-descriptor', function(val) {
  var displayUrl = window.location + "#" + JSON.stringify(val);
  var paper_table = document.getElementById('paper-table'); 
  var p = document.createElement('tr'); 
  
  p.innerHTML = makeRow(displayUrl, val.name); 
  paper_table.appendChild(p);  
  //paper_table.insertBefore(p,paper_table[0]);
});
/*
var browsePapersCtrl = function ($scope) {
  $scope.papers = [];

  for ()
  $scope.papers.push({
    date: '1/1/2014',
    title: 'paper 1'
  });

  $scope.papers.push({
    date: '1/1/2014',
    title: 'paper 1'
  });

  $scope.nextPage = function (currPage) {
    $modalInstance.dismiss('cancel');
  };

  $scope.cancel = function () {
    $modalInstance.dismiss('cancel');
  };
};
*/
window.onload = function() {
  try {
    var hash = JSON.parse(window.location.hash.substr(1));
    console.log("hash " + hash.name); 
    freedom.emit('download', hash);
    if (hash.name) {
      window.rr_name = hash.name;
    }
  } catch (e) {
    console.log("No parseable hash. Don't download");
  }
}; 