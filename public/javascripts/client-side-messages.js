import * as accountsOperation from './account_operate.js';
//let dev_URL = 'http://localhost:3000';
let prod_URL = 'https://excellence-freelance.herokuapp.com/' || 'http://localhost:3000';//window.location.hostname
var socket = io.connect(prod_URL);

let receiver, pageToGo, pagesNames, pagesSections;

// Get sender identifier
let loggedInUser = JSON.parse($('#sender-unique-key').val());
console.log('Logged in user: ', loggedInUser)
socket.emit('join', loggedInUser);

/********************* First: find Receiver and right room of conversation ***********************/
// Conversation initializer by clicking 'Message' button
$('#freelance-mssg-btn').click(function (event) {
    let freelancerToMessage_uniqueKey = $("#freelancerToMessage-unique-key").val();

    window.location.href = '/account/'+loggedInUser.type+'/'+
        loggedInUser.uniqueKey+'?receiverKey='+freelancerToMessage_uniqueKey;
});

$( document ).ready(function() {
    $('.user-messages-side').empty();
    $('.all-different-conversations-container').empty();

    if($('#clicked-receiver-key')[0]){
        receiver = $('#clicked-receiver-key').val();
        receiver = JSON.parse(receiver);

        let sourceImage = !receiver.userToMessageImageSrc ? '/images/userDefaultImage.png'
            :receiver.userToMessageImageSrc;

        roomsFromDB({requirement: 'getRooms'}, receiver, sourceImage);
    }else{
        roomsFromDB({requirement: 'getRooms'});
    }
});




// Ongoing conversation and restarted by opening the chat room
$(document).on('click', '.message-single-room', function(currentRoom) {

    let freelancerToMessage = this.childNodes[1].childNodes[0].childNodes[1].value;
    let roomIndex = Array.from(this.parentNode.children).indexOf(this)
    receiver = JSON.parse(freelancerToMessage);
    history.pushState(null, null, '/account/'+loggedInUser.type+'/'+
        loggedInUser.uniqueKey+'?receiverKey='+receiver.uniqueKey);

    $('.default-message-content').hide();
    $('.user-messages-side')[0]
        .childNodes.forEach(eachRoom => {
        $(eachRoom).removeClass("roomClicked");
    })
    if($(this)[0].className.includes("messageReceived")){
        $( this ).removeClass( "messageReceived" )

        roomsFromDB({requirement: 'update',
            roomIndex: roomIndex});
    }

    accountsOperation.roomConversationsNavigation(this,
        '.all-different-conversations-container',
        loggedInUser.uniqueKey, receiver.uniqueKey);
})
/********************* Second: Sending Messages ***********************/

let messageData = {}

function messageController(receiverData, messageToSend) {
    /*
    * This function deals with the construction of the necessary information
    * for sending message from one user to another.
    * */

    messageData.sender = loggedInUser.uniqueKey;
    messageData.receiver = receiverData.uniqueKey;

    //Get message to send
    let message = messageToSend;
    let messageSendTime = new Date();
    console.log('Inside the controller', message);
    if(message.length>=1){
        messageData.message = message;
        messageData.day = messageSendTime.toLocaleDateString('en-GB', {
            month: '2-digit',day: '2-digit',year: 'numeric'});
        messageData.time = moment(messageSendTime.toLocaleTimeString(), ["h:mm A"]).format("HH:mm");
        socket.emit('MessageInput', messageData);
    }
}

$(document).on('keypress', '.chat-typing-area', function(event) {
    if(event.keyCode=== 13 && event.shiftKey == false){
        event.preventDefault();

        //console.log(receiver.uniqueKey);
        //console.log(event.target.parentNode.parentNode.classList[1]);
        let message = event.target.value;
        messageController(receiver, message.trim());

        // Clear send form box
        $(".chat-typing-area").val('');
    }
})

$(document).on('click', '.message-container-typeBox i', function(event) {
    event.preventDefault();
    let message = event.target.parentNode.childNodes[0].value;

    messageController(receiver, message.trim());

    // Clear send form box
    $(".chat-typing-area").val('');

    // Start typing again
    $(".chat-typing-area").focus();
})

socket.on('Send Message', outputData => {
    // Send received
    console.log('Send Message');
    console.log(outputData);

    let messageReceiver = outputData.receiver;
    let allRooms_senderSide = $('.user-messages-side')[0].childNodes;
    let allConversationRooms_senderSide = $('.user-messages-main-container-box')[0]
        .childNodes[1].childNodes;

    allConversationRooms_senderSide.forEach((eachRoom, index) => {
        if(eachRoom.classList[1] === messageReceiver
            && allRooms_senderSide[index].classList[1] === messageReceiver){
            accountsOperation.createMessageHTML(outputData,
                'user-single-send-message', eachRoom.childNodes[1]);
            $(eachRoom.childNodes[1]).animate({
                    scrollTop: $(eachRoom.childNodes[1])[0].scrollHeight},
                1000);
            $(allRooms_senderSide[index]).parent().prepend(allRooms_senderSide[index]);
            $(eachRoom).parent().prepend(eachRoom);
        }
    })
})


socket.on('Receive Message', outputData => {
    // Message received
    console.log('Receive Message');
    console.log(outputData)

    let messageSender = outputData.sender;

    let allRooms_receiverSide = $('.user-messages-side')[0].childNodes;
    let roomReceived;
    let allConversationRooms_receiverSide = $('.user-messages-main-container-box')[0]
        .childNodes[1].childNodes;

    $.ajax({
        type: 'GET',
        url: '/messages/get-profile/'+messageSender,
        success: function (data) {
            let sourceImage = !data.userImageSrc ? '/images/userDefaultImage.png'
                :data.userImageSrc;
            let senderData = data.userData;

            if(allConversationRooms_receiverSide.length === 0){
                // The receiver does not have any chat yet. So, create one

                accountsOperation.createNewRoom(senderData, sourceImage); // Create a new room
                accountsOperation.createNewConversationContainer(senderData, sourceImage); // Create New Conversation holder

                accountsOperation.createMessageHTML(outputData,
                    'user-single-receive-message', allConversationRooms_receiverSide[0].childNodes[1]);
                $(".message-container-main").animate({
                        scrollTop: $(".message-container-main")[0].scrollHeight},
                    1000);
                roomReceived = 0;
            }else{
                // The receiver has other chats, so find the correct one. There are two scenarios:

                let conversationRoomExists = false;
                let conversationRoom;

                for (var i = 0; i < allConversationRooms_receiverSide.length; ++i) {
                    if(allConversationRooms_receiverSide[i].classList[1] === messageSender){
                        conversationRoomExists = true;
                        conversationRoom = allConversationRooms_receiverSide[i];
                        roomReceived = i;
                        break;
                    }
                }

                // Users never spoken to this particular sender. So create room
                if(!conversationRoomExists){
                    accountsOperation.createNewRoom(senderData, sourceImage); // Create a new room
                    accountsOperation.createNewConversationContainer(senderData, sourceImage); // Create New Conversation holder

                    conversationRoom = $('.user-messages-main-container-box')[0]
                        .childNodes[1].childNodes[0];
                    roomReceived = 0;
                }

                // Show message
                accountsOperation.createMessageHTML(outputData,
                    'user-single-receive-message', conversationRoom.childNodes[1]);
                $(conversationRoom.childNodes[1]).animate({
                        scrollTop: $(conversationRoom.childNodes[1])[0].scrollHeight},
                    1000);
            }
            $('.newMessageReceived').show();
            $(allRooms_receiverSide[roomReceived])[0].classList.add('messageReceived');
            $(allRooms_receiverSide[roomReceived]).parent().prepend(allRooms_receiverSide[roomReceived]);
            $(allConversationRooms_receiverSide[roomReceived]).parent().prepend(allConversationRooms_receiverSide[roomReceived]);
        },
        error: function (error) {
            console.log('Message not received - error: ', error)
        }
    })
})

/********************* Third: Retrieving Rooms from DB ***********************/

function roomsFromDB(roomRequirement, receiver, sourceImage){

    let requirement = roomRequirement.requirement;

    $.ajax({
        type: 'GET',
        url: '/messages/get-messages-rooms/'+loggedInUser.uniqueKey+'?requirement='+requirement+'&roomIndex='+roomRequirement.roomIndex,
        success: function (data) {
            if(requirement === 'getRooms'){

                if(data.length > 0){
                    data.forEach((eachData, index) => {

                        let sourceImage = !eachData.userImageSrc ? '/images/userDefaultImage.png'
                            :eachData.userImageSrc;
                        let userData = eachData.userData;
                        console.log(userData)
                         // Create a new room
                        if(!userData.roomIsClicked && userData.lastMessageSender !== loggedInUser.uniqueKey){
                            console.log('Coming here')
                            userData.messageReceivedClassName = 'messageReceived';
                            accountsOperation.createNewRoom(userData, sourceImage);
                            $('.newMessageReceived').show();
                        }else{
                            accountsOperation.createNewRoom(userData, sourceImage);
                        }
                        accountsOperation.createNewConversationContainer(userData, sourceImage); // Create New Conversation holder
                    })

                }


                let allMessageRooms = $('.user-messages-side')[0].childNodes;
                let roomIdex;
                if(receiver && sourceImage){
                    // This bit handles the loading of the chat when the button
                    // Message on the freelancer side is clicked

                    if(allMessageRooms.length === 0){
                        // There no messages yet

                        accountsOperation.createNewRoom(receiver, sourceImage); // Create a new room
                        accountsOperation.createNewConversationContainer(receiver, sourceImage); // Create New Conversation holder
                        roomIdex = 0;
                    }else{
                        // There are already some messages going on. Now, we need to check if
                        // the two current users already have a conversation going on
                        let roomExists = false;
                        let roomToShow;

                        for (var i = 0; i < allMessageRooms.length; ++i) {
                            if(allMessageRooms[i].classList[1] === receiver.uniqueKey){
                                roomExists = true;
                                roomIdex = i;
                                break;
                            }
                        }

                        if(!roomExists){
                            // Room does not exist. users have never spoken before

                            accountsOperation.createNewRoom(receiver, sourceImage); // Create a new room
                            accountsOperation.createNewConversationContainer(receiver, sourceImage); // Create New Conversation holder
                            roomIdex = 0;
                        }
                    }
                    $('.default-message-content').hide();
                    accountsOperation.roomConversationsNavigation(
                        allMessageRooms[roomIdex],
                        '.all-different-conversations-container',
                        loggedInUser.uniqueKey, receiver.uniqueKey);
                }

            }else if(requirement === 'update'){
                console.log(data)
            }
        },
        error: function (error) {
            console.log('Messages not retrieved - error: ', error)
        }
    })
}


