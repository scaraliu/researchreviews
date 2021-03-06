app.controller('reviewsController', function($scope, $modal) {
	$scope.showNav = true; 
	$scope.reviews = []; 

	$scope.currReview; 
	$scope.currRVersion = {};

	$scope.privacyHeading; 

	window.freedom.emit('get-reviews', 0); 

	//TODO: temporary. until storage buffer
	function str2ab(str) {
	  var buf = new ArrayBuffer(str.length*2); // 2 bytes for each char
	  var bufView = new Uint8Array(buf);
	  for (var i=0, strLen=str.length; i<strLen; i++) {
	    bufView[i] = str.charCodeAt(i);
	  }
	  return buf;
	}

	$scope.downloadRPaper = function() {
		$scope.currRVersion.download();
	}; 

	$scope.getReviewView = function(rkey){
		for (var i = 0; i < $scope.reviews.length; i++){
			if ($scope.reviews[i].rkey === rkey){
				$scope.currReview = $scope.reviews[i];
				break;
			}
		}

		var msg = {
			pkey: $scope.currReview.pkey,
			vnum: $scope.currReview.vnum,
			from: username,
			to: $scope.currReview.author,
      		action: 'get-r-paper'
		};
		window.freedom.emit('get-r-paper', msg);
	}; 

	window.freedom.on('send-r-paper', function(msg){
    
		//show reviews of a paper that this reviewer is able to access
    console.log("SEND R PAPER " + JSON.stringify(msg));
    if (msg.err) {
      $scope.currRVersion = false;
      alert(msg.err);
      $scope.$apply();
      return;
    }
    $scope.currRVersion = new Version(msg);
		var paperReviews = $scope.currRVersion.reviews; 
		if(paperReviews)
		    for (var i = 0; i < paperReviews.length; i++){
	    	 	var r_msg = {
			        pkey: $scope.currRVersion.pkey, //
			        rkey: paperReviews[i].rkey,
			        reviewer: paperReviews[i].reviewer,//
			        vnum: paperReviews[i].vnum,
			        author: $scope.currRVersion.author,
			        from: username
	        	};
	       	 	window.freedom.emit('get-paper-review', r_msg);
		    }	

		$scope.$apply();
	});
	
  window.freedom.on('got-paper-review', function(data) {
		if(!$scope.currRVersion.reviews) $scope.currRVersion.reviews = []; 
		
		for (var i = 0; i < $scope.currRVersion.reviews.length; i++){
      console.log("DATA HERE " + JSON.stringify(data));
			if ($scope.currRVersion.reviews[i].reviewer === data.reviewer){
				$scope.currRVersion.reviews[i] = new Review(data.review); 
			}
		}	
		$scope.$apply(); 
	});


	$scope.getPendingReviews = function() {
		$("#pendingBtn").attr('class', "btn btn-default active"); 
  		$("#pastBtn").attr('class', "btn btn-default"); 
  		window.freedom.emit('get-reviews', 0);
	};

	$scope.getPastReviews = function() {
		$("#pastBtn").attr('class', "btn btn-default active"); 
  		$("#pendingBtn").attr('class', "btn btn-default"); 
		window.freedom.emit('get-reviews', 1); 
	}; 

	$scope.downloadReviews = function() {
		console.log("reviews....." + JSON.stringify($scope.reviews));

		var totalReviews = "Reviews for " + $scope.currRVersion.title; 
		for(var i = 0; i < $scope.reviews.length; i++) 
			totalReviews = totalReviews + "\n" + $scope.reviews[i].reviewer + " on " + $scope.reviews[i].date + ": " + $scope.reviews[i].text; 
		
		var ab =str2ab(totalReviews);
		var reader = new FileReader(); 
		var blob = new Blob([ab], {type:'text/plain'});
		reader.readAsArrayBuffer(blob);
    	saveAs(blob, $scope.currRVersion.title+"_reviews");
	}; 

	function str2ab(str) {
	    var buf = new ArrayBuffer(str.length*2); // 2 bytes for each char
	    var bufView = new Uint8Array(buf);
	    for (var i=0, strLen=str.length; i<strLen; i++) {
	      bufView[i] = str.charCodeAt(i);
	    }
	    return buf;
  	}

	$scope.addReview = function() {
		var modalInstance = $modal.open({
		  	templateUrl: '/modals/addReviewTemplate.html',
		  	windowClass:'normal',
		  	controller: addReviewCtrl,
		  	backdrop: 'static',
		  	resolve: {
		    	currReview: function() {
			      	return $scope.currReview; 
	    		},
	    		reviews: function(){
	    			return $scope.reviews;
	    		},
	    		currRVersion: function(){
	    			return $scope.currRVersion;
	    		}  	
		 	}
		});
	};  

	var addReviewCtrl = function ($scope, $modalInstance, currReview, reviews, currRVersion) {
		$scope.states = userList; 
	    $scope.selected = undefined;
	    $scope.alerts = [];
	    $scope.privacySetting;
	    $scope.currReview = currReview; 
	    $scope.privacyHeading = currReview.accessList === 'public'? "public" : "private"; 

	    $scope.init = function(author) {
	    	$scope.states.splice($scope.states.indexOf(author), 1); 
	    	console.log("ACCESS LIST: " + (typeof currReview.accessList) + JSON.stringify(currReview.accessList));
	    }; 

	    $scope.init(currReview.author); 

	    $scope.selectMatch = function(selection) {
	      $scope.alerts.push({msg: selection});
	    };

	    $scope.deleteUser = function(id) {
	      $scope.alerts.splice(id, 1);
	    };

	    $scope.setPrivate = function() {
	    	$scope.privacySetting = true;
	    };

	    $scope.setPublic = function() {
	    	$scope.privacySetting = false; 
	    };

	  	$scope.upload = function () {
		    var today = new Date();  

		    currReview.text = $("#reviewText").val(); 
		    currReview.date = today; 
		    currReview.accessList = []; 

			if ($scope.privacySetting) {
				currReview.accessList.push(username);
				currReview.accessList.push(currReview.author); 
				for(var i = 0; i < $scope.alerts.length; i++)
					currReview.accessList.push($scope.alerts[i].msg); 
			}
			else currReview.accessList = false; 

			window.freedom.emit('set-review', currReview);
		  	window.freedom.emit('upload-review', currReview);

			var index = currRVersion.reviews.map(function(el) {
				return el.reviewer;
			}).indexOf(username);
			
			if(index === -1) currRVersion.reviews.push(currReview);
			else currRVersion.reviews[index] = currReview; 

		    $modalInstance.dismiss('cancel'); 
	  };

	  $scope.cancel = function () {
	    $modalInstance.dismiss('cancel');
	  };
	};

	window.freedom.on('display-reviews', function(reviews) {
  console.log("in dispaly-reviews, " + JSON.stringify(reviews));
		$scope.reviews=[];
		for (var i = 0; i < reviews.length; i++){
			var review = new Review(reviews[i]);
			$scope.reviews.push(review);
		}

		if ($scope.reviews.length > 0) {
			$scope.currReview = $scope.reviews[0];
			var msg = {
				pkey: $scope.currReview.pkey,
				vnum: $scope.currReview.vnum,
				from: username,
				to: $scope.currReview.author,
				action: 'get-r-paper'
			};
      $scope.$apply();
      console.log('here are the reviews ' + JSON.stringify($scope.reviews));
			window.freedom.emit('get-r-paper', msg);
		}
    else {
      $scope.currReview = false;
		  $scope.$apply();
  	}
  });
});
