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
var channelID = "";
var role = "";
var emotemCount = 0;

//Initialize emotem function on startup
window.onload = function() {
  // window.emotem = new emotem();
  database = firebase.database();

  streamerID = 23161357; //change to the channelID
  //render new emotem list everytime there is an update to the database
  database.ref('/'+streamerID).on('value', (snapshot) => {
    console.log("database changed");
    populateEmotesTotem(streamerID);
  })
  
};


function checkChannel(callback) {
    if (channelID) {
        database.ref(channelID).once('value').then(function(snapshot) {
            if (!snapshot.exists()) {
                database.ref(channelID).set({
                    EmotesTotemCount: 0,
                    EmotesTotemList: {}
                });
            }
        });
    }
    callback();
}

function updateTotem(emotem) {
    var count = 0;
    database.ref(channelID).once('value').then(function(snapshot) {
        if (snapshot.exists()) {
            count = snapshot.val().EmotesTotemCount;
            count++;
            database.ref(channelID ).update({EmotesTotemCount: count});
            var updates = {};
            updates[count] = emotem;
            database.ref(channelID + '/EmotesTotemList').update(updates);
        }
    })
}

function renderTotemCount(channelID) {
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
            //Clear the entire list
            $("#emoteList").empty();
            renderTotemCount(channelID);

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

    channelID = auth.channelId;
    console.log(channelID);
    role = tuid.role;
    var testEmotem = {
        EmoteID: 12736,
        EmoteImgURL: "https://static-cdn.jtvnw.net/emoticons/v1/12736/2.0",
        TimeStamp: "some random date"
    };
    checkChannel(function() {
        updateTotem(testEmotem);
    });

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
