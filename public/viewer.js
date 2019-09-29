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
var isBroadcaster = false;
var emotemCount = 0;
var updatedVotingEmotes = false;

var payloadId = 15598;
var payloadTimestamp = "Sun, 29 Sep 2019 14:31:43 GMT";

//Initialize emotem function and database on startup
window.onload = function() {
  database = firebase.database();
}
//Initialize emotem function on startup
/*window.onload = function() {
  // window.emotem = new emotem();
  database = firebase.database();

  streamerID = 23161357; //change to the channelID

  //render new emotem list everytime there is an update to the database
  //check if also payload was changed
  database.ref('/'+streamerID).on('value', (snapshot) => {
    var snap = snapshot.val();
    console.log("database changed");
    populateEmotesTotem(streamerID);

    if (snap['Payload'] != null)
    {
      console.log("payload is not null");
      updateVotingEmotes(streamerID);
    }

  })
  
};*/


function checkChannel(callback) {
    if (channelID) {
        database.ref(channelID).once('value').then(function(snapshot) {
            if (!snapshot.exists()) {
                database.ref(channelID).update({
                    EmotesTotemCount: 0,
                    EmotesTotemList: {},
                    hasNewPayload : false
                });
            }
            else if (!snapshot.val().EmotesTotemCount) {
              database.ref(channelID).update({
                    EmotesTotemCount: 0,
                    EmotesTotemList: {},
                    hasNewPayload: false
                });
            }
        });
    }
    callback();
}

function updateTotem(emotem) {
    var count = 0;
    database.ref(channelID+'/EmotesTotemCount').once('value').then(function(snapshot) {
        if (snapshot.exists()) {
            count = snapshot.val();
            console.log("count incremented" + count);
            count++;
            database.ref(channelID).update({EmotesTotemCount: count});
            var updates = {};
            updates[count-1] = emotem;
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

            if (snapshot.exists()) {
              var EmotesTotem = snapshot.val();
              Object.keys(EmotesTotem).forEach(function (number) {
                //console.log(number); // key
                //console.log(EmotesTotem[number]); // value
                //console.log(EmotesTotem[number].EmoteImgURL);
                $("#emoteList").prepend("<li><img src="+ EmotesTotem[number].EmoteImgURL+" alt=icon class=emote align=center> </li>");
            
            });
            }
        });

}

function updateVotingEmotes(channelID) {
  updatedVotingEmotes = true;
  console.log("updating emotes");
  database.ref(channelID+'/Payload/EmotesIdList')
        .once('value').then(function(snapshot) {
            //Clear the entire list
            $("#votingEmotes").empty();
            $('#voteText').html("Vote Now! 10");
            $('#votingEmotes').css("visibility", "visible");

            if (snapshot.exists()) {
              var EmotesList = snapshot.val();
              Object.keys(EmotesList).forEach(function (number) {
                //console.log(number); // key
                //console.log(EmotesTotem[number]); // value
                //console.log(EmotesTotem[number].EmoteImgURL);
                var imgURL = "https://static-cdn.jtvnw.net/emoticons/v1/"+ EmotesList[number].ID + "/2.0";
                $("#votingEmotes").prepend("<span class=voteEmotesImg> <img src=" + imgURL + " alt=icon class=emote align=center> </span>");
              
              });
          }
            
            //Timer
            var count=10;

            var counter=setInterval(function() 
            {
              count=count-1;
              if (count <= 0)
              {
                 $('#voteText').html("Vote Now! " + count);
                 clearInterval(counter);

                 if (isBroadcaster) {
                  var emoteId = 15598;
                  checkVoteResult(payloadId);
                  console.log("max: " + payloadId);

                  var newEmotem = {
                    EmoteID: payloadId,
                    EmoteImgURL: "https://static-cdn.jtvnw.net/emoticons/v1/" + payloadId + "/2.0",
                    TimeStamp: payloadTimestamp
                  };
                  updateTotem(newEmotem);
                 }

                 populateEmotesTotem(channelID);
                 //delete the payload
                
                 updatedVotingEmotes = false;
                 $('#voteText').html("Waiting for HYPE!");
                 //uncomment next line later
                 $('#votingEmotes').css("visibility", "hidden");
                 
                 //Find the top voters 
                 

                 //database.ref(channelID+'/Payload').remove();

                 
                 return;
              }

              $('#voteText').html("Vote Now! " + count);
            }, 1000);

            
            
        });
}


$(document).on("click", ".voteEmotesImg", function(){
  console.log("vote");
  var index = $(this).index(".voteEmotesImg");

  database.ref(channelID+'/Payload/EmotesIdList/'+index+'/Votes')
        .once('value').then(function(snapshot) {

            var votes = snapshot.val();
            console.log("votes" + votes);
            
            votes = votes + 1;
            database.ref(channelID + '/Payload/EmotesIdList/'+index).update({ Votes: votes });
        });

});

function checkVoteResult() {
  var maxVote = 0;
  database.ref(channelID + '/Payload/EmotesIdList').once('value').then(function(snapshot) {
    var emoteList = snapshot.val();
    var maxID = emoteList[0].ID;
    var maxVote = emoteList[0].Votes;
    for (var i = 1; i < 4; i++) {
      if (emoteList[i].Votes > maxVote) {
        maxID = emoteList[i].ID;
        maxVote = emoteList[i].Votes;
      }
    }
    payloadId = maxID;
    console.log("vote result: " + maxID);
  })
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
    console.log(tuid);

    channelID = auth.channelId;
    console.log(channelID);

    if (tuid.substring(1) == channelID) {
      isBroadcaster = true;
      console.log("is broadcaster");
    }

    var testEmotem = {
        EmoteID: 12736,
        EmoteImgURL: "https://static-cdn.jtvnw.net/emoticons/v1/12736/2.0",
        TimeStamp: "some random date"
    };
    checkChannel(function() {
        populateEmotesTotem(channelID);
        //I moved everything from the onWindowLoad here, so once auth is through, then start everything.
        //render new emotem list everytime there is an update to the database
        //check if also payload was changed
        database.ref(channelID + '/hasNewPayload').on('value', function(snapshot) {
          console.log("has new payload " + snapshot.val());

          if (snapshot.val()) {
            console.log("past the if loop");
            database.ref(channelID + '/Payload').once('value').then(function(snapshot) {
              var snap = snapshot.val();
              console.log("payload arrived");
              // populateEmotesTotem(channelID);

              if (snap != null && updatedVotingEmotes == false)
              {
                console.log("payload is not null");
                $('#votingEmotes').css("visibility", "visible");
                updateVotingEmotes(channelID);

                if (snap.Timestamp) {
                  payloadTimestamp = snap.Timestamp;
                  console.log(payloadTimestamp);
                }
                
              }
            });

            database.ref('/' + channelID).update({hasNewPayload: false});
          }
          

        });


              //updateTotem(testEmotem);
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
