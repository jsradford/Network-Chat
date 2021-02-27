
//Specify the person-channel network. {player 1: [channel 1, channel 2, ...], ...}
//The keys are the player number and the items in the list are the channels they are on.
var chat_channel_matrix = {
    "1":[4,1],
    '2':[1,2],
    '3':[2,3],
    '4':[3,4]
}

//Create global variables
var dictFlashIntervals = {};
var chat_channel_count = '' //
var curOpenChannel = ''; //
var auto_scroll_chat = false; //does chat scroll to most recent message when you open the channel?
var chat_show_empty_prompt = true; //should we show instructions if the chat is empty?
var chat_max_channels_per_column = 10; //layout variable - number of channels to show in each column
var chat_flash_interval = 400; //how frequently chat channel flashes when there's a message (in milliseconds)



// start the study
function initialize() {
    setupChatChannels(chat_channel_matrix); //function creates the chat network
}

// Call this in initialize to setup the channels. 
// It takes the css ids you want to target for the chat window selectors and the chat windows themselves
function setupChatChannels(dictChatMatrix) {
    console.info("setChatMatrix() - me: " + myid + ", matrix: " + JSON.stringify(dictChatMatrix));
    
    //get the number of channels to figure out how many to create in the interface
    var curMaxChannel = 1;
    for (var participant in dictChatMatrix) {          //for each participant
        var tempArr = dictChatMatrix[participant]; 
        for (var i = 0; i < tempArr.length; i++) {  // for each channel the person is on
            var val = tempArr[i];
            if (val > curMaxChannel) {
                curMaxChannel = val;
            }
        }
    }
    chat_channel_count = curMaxChannel;

    var colCount = Math.ceil(chat_channel_count / chat_max_channels_per_column);
    var channelsPerCol = Math.ceil(chat_channel_count / colCount);
    
    var divChatChannels = $('#divChatChannels');
    divChatChannels.empty();
    
    var tblChatChannelsHtml = 
        '<table id="tblChatChannels" class="chatChannelsTable">\r\n' +
        ' <tr>\r\n';
  
  for (var i = 1; i <= colCount; i++) {
    // The channel listing and open buttons will go in a <ul>.
    tblChatChannelsHtml +=
      '   <td id="tdChatCol' + i + '">\r\n' +
      '     <ul id="ulChatChannels' + i + '" class="chatChannels"></ul>\r\n' +
      '   </td>\r\n';
  }
    tblChatChannelsHtml +=
    ' </tr>\r\n' +
    '</table>';
    var tblChatChannels = $(tblChatChannelsHtml);

    var divChatWindows = $('#divChatWindows');
    divChatWindows.empty();
  if (chat_show_empty_prompt) {
    var divEmptyChatWindow = $(
      '<div id="divEmptyChatWindow" class="divChatWindow chat-panel panel panel-default cc_wrapper">' +
      ' Click on a Chat Channel to Open a Chat Window' +
      '</div>'
      );
    divChatWindows.append(divEmptyChatWindow);
  }
  for (var i = 0; i < chat_channel_count; i++) {
    var curCol = Math.floor(i / channelsPerCol) + 1;
    var channelId = i + 1;
    // setup the channel listing as a new <li>
    var li = $('<li class="liChatChannel liDisabled" channelId="' + channelId + '">Chat Channel ' + channelId + '</li>');
    li.click(function () {
      // clicking the element opens the corresponding chat channel
      openChatChannel($(this).attr('channelId'));
    });
    tblChatChannels.find('#ulChatChannels'+curCol).append(li);

    // create the actual chat window
    var chatWindowHtml =
                      '<div id="divChatWindow' + channelId + '" class="divChatWindow chat-panel panel panel-default" channelId="' + channelId + '">';
    chatWindowHtml += '  <div class="divChatHeader">Chat Channel ' + channelId;
    chatWindowHtml += '   <span class="closeChatWindow">X</span>';
    chatWindowHtml += '  </div>';
    chatWindowHtml += '  <div class="panel-body">';
    chatWindowHtml += '   <div class="cc_wrapper">';
    chatWindowHtml += '     <ul class="chat_content"></ul>';
    chatWindowHtml += '   </div>';
    chatWindowHtml += '  </div>';
    chatWindowHtml += '  <div class="chatSend">';
    chatWindowHtml += '    <div class="chatSendBar">';
    chatWindowHtml += '      <button class="btn btn-primary sendChat" channelId="' + channelId + '">Send</button>';
    chatWindowHtml += '        <div class="chatSendContainer">';
    chatWindowHtml += '          <textarea type="text" class="chatSendField" rows="3" channelId="' + channelId + '"></textarea>';
    chatWindowHtml += '        </div>';
    chatWindowHtml += '    </div>';
    chatWindowHtml += '   </div>';
    chatWindowHtml += '</div>';

    var divChatWindow = $(chatWindowHtml);

    // enter key keypress function (to send chat).
    // if you hold down the ctrl+enter does a new line
    divChatWindow.find('.chatSendField').keypress(function (event) {
      if (event.which == 13 || event.which == 10) {
        var sendField = $(this);
        if (event.ctrlKey) {
          var val = sendField.val();
          sendField.val(val + "\n");
        } else {
          sendChatMsg(sendField.val(), sendField.attr('channelId'));
          sendField.val("");
          event.preventDefault();
        }
      }
    });

    // setup the send button click as well
    divChatWindow.find(".sendChat").click(function () {
      var sendField = $('.chatSendField[channelId="' + $(this).attr('channelId') + '"]');
      sendChatMsg(sendField.val(), sendField.attr('channelId'));
      sendField.val("");
    });

    // add the close chat capability
    divChatWindow.find(".closeChatWindow").click(function () {
      $('.divChatWindow').hide(250);
      curOpenChannel = null;
      if (chat_show_empty_prompt) {
        $('#divEmptyChatWindow').show(500);
      }
      //$('#divOpenChat').show(500);
    });

    $('#divChatWindows').append(divChatWindow);
  }


    divChatChannels.append(tblChatChannels);
    $('.divChatWindow').hide();
    if (chat_show_empty_prompt) {
        $('#divEmptyChatWindow').show();
    }
    var ulChatChannels = $('#ulChatChannels');
    if (dictChatMatrix[myid] != null) {
        for (var i = 0; i < dictChatMatrix[myid].length; i++) {
            var channelId = dictChatMatrix[myid][i];
            //ulChatChannels.find('li[channelId="'+channelId+'"]').removeAttr('disabled');
            tblChatChannels.find('li[channelId="' + channelId + '"]').removeClass('liDisabled');
        }
    }


  var dictTitles = {};
  for (var i = 1; i <= numPlayers; i++) {
    if (dictChatMatrix[i] != null) {
      for (var j = 0; j < dictChatMatrix[i].length; j++) {
        var channelId = dictChatMatrix[i][j];
        var chatString = (i == myid ? "(You)" : "Participant " + i);
        if (dictTitles[channelId] == null) {
          dictTitles[channelId] = chatString;
        }
        else {
          dictTitles[channelId] += ", " + chatString;
        }
      }
    }
  }
  for (var i = 1; i <= chat_channel_count; i++) {
    tblChatChannels.find('li[channelId="' + i + '"]').attr('title', dictTitles[i]);
  }
}

// Opens the chat window for the channel you click
function openChatChannel(channelId) {
    $('.divChatWindow').hide(250);
    $('.divChatWindow[channelId="' + channelId + '"]').show(500);
    $('.liChatChannel').removeClass('liSelected');
    var liChatChannel = $('.liChatChannel[channelId="' + channelId + '"]');
    
    stopChatFlash(channelId);
    liChatChannel.addClass('liSelected');
    curOpenChannel = channelId;
}

function stopChatFlash(channelId) {
  // if the channel was flashing, stop the flash animation
  if (dictFlashIntervals[channelId] != null) {
    var liChatChannel = $('.liChatChannel[channelId="' + channelId + '"]');
    clearInterval(dictFlashIntervals[channelId]);
    dictFlashIntervals[channelId] = null;
    liChatChannel.stop(true, true);
    while (liChatChannel.hasClass('liChatChannel-Flash')) {
      liChatChannel.removeClass('liChatChannel-Flash');
    }
  }
}

//empty the content on a channel (good for multi-round studies but not used in the template)
function clearChatWindow(channelId) {
  var cp = $('.divChatWindow[channelId="' + channelId + '"]');
  var cc = cp.find(".chat_content");
  cc.empty();
  stopChatFlash(channelId);
  $('.liChatChannel[channelId="' + channelId + '"]').removeClass('liSelected');
  if (channelId == curOpenChannel) {
    $('.divChatWindow').hide(250);
    if (chat_show_empty_prompt) {
      $('#divEmptyChatWindow').show(500);
    }
    curOpenChannel = 0;
  }
}

//empty the content on all channels (good for multi-round studies but not used in the template)
function clearAllChatWindows() {
  $('.chat_content').empty();
  $('.liChatChannel').removeClass('liSelected').stop(true, true).removeClass('liChatChannel-Flash');
  for (var channelId in dictFlashIntervals) {
    if (dictFlashIntervals[channelId] != null) {
      clearInterval(dictFlashIntervals[channelId]);
    }
  }
  $('.divChatWindow').hide(250);
  if (chat_show_empty_prompt) {
    $('#divEmptyChatWindow').show(500);
  }
  curOpenChannel = null;
}

// We either sent a chat or received a chat, so append it to the correct window
function appendChat(s_from, msg, channelId, clz, bFlash) {
  var cp = $('.divChatWindow[channelId="' + channelId + '"]');
  var cc = cp.find(".chat_content");
  var cwrap = cp.find(".cc_wrapper");
  while (msg.indexOf('\n') >= 0) {
    msg = msg.replace('\n', '<br/>');
  }

  cc.append('<li class="' + clz + '">' +
            '  <span class="chatFrom">' + s_from +
            ' (' + new Date().toLocaleString('en-US', { hour12: false }) + ') ' +
            ': ' + msg +
            '</li>');

  if (auto_scroll_chat) {
    cwrap.stop(); // prevent the animations from queueing up
    cwrap.animate({ scrollTop: cwrap.prop("scrollHeight") }, 1000);
  }

  if (bFlash) {
    var liChannel = $('.liChatChannel[channelId="' + channelId + '"]');
    // if we received a message for a chat window that isn't currently open, add a flash to indicate messages are pending
    if (channelId != curOpenChannel && dictFlashIntervals[channelId] == null) {
      var bFlashOn = false;
      dictFlashIntervals[channelId] = setInterval(function () {
        if (bFlashOn) {
          liChannel.removeClass('liChatChannel-Flash', chat_flash_interval);
        }
        else {
          liChannel.addClass('liChatChannel-Flash', chat_flash_interval);
        }
        bFlashOn = !bFlashOn;
      }, chat_flash_interval);
    }
  }
}

// Send a chat message to this channel
function sendChatMsg(msg, channelId) {
  if (msg.length == 0) {
    return;
  }
  sendCom("Chat", -1, { 'channelId': channelId, 'msg': encodeURI(msg) });
  //sendChat(msg,[participant]);
  appendChat("You", msg, channelId, "c_you", false);
}



// This needs to be called from the main comReceived function
function chatReceived(participant, msg, channelId) {
  var liChannel = $('.liChatChannel[channelId="' + channelId + '"]');

  //if this channel is disabled, ignore the message
  if (liChannel.hasClass('liDisabled')) {
    return;
  }

  // TODO - capture user names?
  appendChat('Participant ' + participant, msg, channelId, "c_oth", true);
}

// Handle communication sent
function comReceived(index, newCom) {
  if (newCom.from == myid) return; // This was sent by me...ignore it.
  switch (newCom.com_type) {
    case -1: // chat message
      chatReceived(newCom.from, decodeURI(newCom.to_parts.msg), newCom.to_parts.channelId);
      break;
    case -2: // round clues   
      //roundChoices = newCom.to_parts;
      //setRound(ROUND_PRACTICE);
      //populateRoundClues(curRound); // these come from participant 1
      break;
    case -3: // clue shared
      clueReceived(newCom.from, decodeURI(newCom.to_parts.clue), newCom.to_parts.channelId); // clues are a special type of chat...handle them similarly
      break;
  }
  return;
}
