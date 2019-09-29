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
var updatedVotingEmotes = false;

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

function updateVotingEmotes(channelID) {
  database.ref(channelID+'/Payload/EmotesIDList')
        .once('value').then(function(snapshot) {
            //Clear the entire list
            updatedVotingEmotes = true;
            $("#votingEmotes").empty();
            $('#voteText').html("Vote Now! 10");

            var EmotesList = snapshot.val();
            Object.keys(EmotesList).forEach(function (number) {
              //console.log(number); // key
              //console.log(EmotesTotem[number]); // value
              //console.log(EmotesTotem[number].EmoteImgURL);
              var imgURL = "https://static-cdn.jtvnw.net/emoticons/v1/"+ EmotesList[number].ID + "/2.0";
              $("#votingEmotes").prepend("<span class=voteEmotesImg> <img src=" + imgURL + " alt=icon class=emote align=center> </span>");
            
            });
            
            //Timer
            var count=10;

            var counter=setInterval(function() 
            {
              count=count-1;
              if (count <= 0)
              {
                 $('#voteText').html("Vote Now! " + count);
                 clearInterval(counter);
                 //delete the payload
                
                 updatedVotingEmotes = false;
                 $('#voteText').html("Voting has ended.");
                 //uncomment next line later
                 $('#votingEmotes').css("visibility", "hidden");
                 database.ref(channelID+'/Payload').remove();

                 
                 return;
              }

              $('#voteText').html("Vote Now! " + count);
            }, 1000);

            
            
        });
}


$(document).on("click", ".voteEmotesImg", function(){
  console.log("vote");
  var index = $(this).index(".voteEmotesImg");

  database.ref(channelID+'/Payload/EmotesIDList/'+index+'/Votes')
        .once('value').then(function(snapshot) {

            var votes = snapshot.val();
            console.log("votes" + votes);
            
            votes = votes + 1;
            database.ref(channelID + '/Payload/EmotesIDList/'+index).update({ Votes: votes });
        });

});



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
        
        //I moved everything from the onWindowLoad here, so once auth is through, then start everything.
        //render new emotem list everytime there is an update to the database
        //check if also payload was changed
        database.ref('/'+channelID).on('value', (snapshot) => {
          var snap = snapshot.val();
          console.log("database changed");
          populateEmotesTotem(channelID);

          if (snap['Payload'] != null && updatedVotingEmotes == false)
          {
            console.log("payload is not null");
            $('#votingEmotes').css("visibility", "visible");
            updateVotingEmotes(channelID);
            
          }

        })


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
