var token = "";
var tuid = "";
var ebs = "";

// because who wants to type this every time?
var twitch = window.Twitch.ext;

// create the request options for our Twitch API calls
var requests = {
    set: createRequest('POST', 'cycle'),
    get: createRequest('GET', 'query')
};

var database;

//Initialize emotem function on startup
window.onload = function() {
  // window.emotem = new emotem();
  database = firebase.database();
  populateEmotesTotem(23161357);
  updateTotemCount(23161357);
  //additionalTest();
};

//Firebase Initialization
function emotem() {
  this.checkSetup();

  //Shortcuts to DOM elements
  
  this.initFirebase();
  this.test();
}

// Checks that the Firebase SDK has been correctly setup and configured.
emotem.prototype.checkSetup = function() {
  if (!window.firebase || !(firebase.app instanceof Function) || !firebase.app().options) {
    window.alert('You have not configured and imported the Firebase SDK. ' +
        'Make sure you go through the codelab setup instructions and make ' +
        'sure you are running the codelab using `firebase serve`');
  }
};

emotem.prototype.initFirebase = function() {
  //Shortcuts to Firebase SDK features
  this.database = firebase.database();
};

// // Get a reference to the database service
// var database = firebase.database();

// window.onload = function() {
//     test();
// }

emotem.prototype.test = function() {
    var result;
    this.database.ref('channelID/EmotesTotemList/1/EmoteImgURL')
        .once('value').then(function(snapshot) {
            console.log(snapshot.val());
        });
}

function additionalTest() {
    database.ref('channelID/EmotesTotemList/1/EmoteID')
        .once('value').then(function(snapshot) {
            console.log(snapshot.val());
        });
}

function updateTotemCount(channelID) {
  database.ref(channelID+'/EmotesTotemCount')
        .once('value').then(function(snapshot) {

            var count = snapshot.val();
            console.log(count);
            $('#totemHeight').html("Totem Height: " + count);
            
        });
}

function populateEmotesTotem(channelID) {
    database.ref(channelID+'/EmotesTotemList')
        .once('value').then(function(snapshot) {

            var EmotesTotem = snapshot.val();
            Object.keys(EmotesTotem).forEach(function (number) {
              //console.log(number); // key
              //console.log(EmotesTotem[number]); // value
              //console.log(EmotesTotem[number].EmoteImgURL);
              $("#emoteList").prepend("<li><img src="+ EmotesTotem[number].EmoteImgURL+" alt=icon class=emote align=center> </li>");
            
            });
            
        });

}
function createRequest(type, method) {

    return {
        type: type,
        url: location.protocol + '//localhost:8081/color/' + method,
        success: updateBlock,
        error: logError
    }
}

function setAuth(token) {
    Object.keys(requests).forEach((req) => {
        twitch.rig.log('Setting auth headers');
        requests[req].headers = { 'Authorization': 'Bearer ' + token }
    });
}

twitch.onContext(function(context) {
    twitch.rig.log(context);
});

twitch.onAuthorized(function(auth) {
    // save our credentials
    token = auth.token;
    tuid = auth.userId;

    // enable the button
    $('#cycle').removeAttr('disabled');

    setAuth(token);
    $.ajax(requests.get);
});

function updateBlock(hex) {
    twitch.rig.log('Updating block color');
    $('#color').css('background-color', hex);
}

function logError(_, error, status) {
  twitch.rig.log('EBS request returned '+status+' ('+error+')');
}

function logSuccess(hex, status) {
  // we could also use the output to update the block synchronously here,
  // but we want all views to get the same broadcast response at the same time.
  twitch.rig.log('EBS request returned '+hex+' ('+status+')');
}

$(function() {

    // when we click the cycle button
    $('#cycle').click(function() {
        if(!token) { return twitch.rig.log('Not authorized'); }
        twitch.rig.log('Requesting a color cycle');
        $.ajax(requests.set);
    });

    // listen for incoming broadcast message from our EBS
    twitch.listen('broadcast', function (target, contentType, color) {
        twitch.rig.log('Received broadcast color');
        updateBlock(color);
    });
});
