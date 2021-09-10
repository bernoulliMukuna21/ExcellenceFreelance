var express = require('express');
var router = express.Router();
var DB_connection = require('../bin/database-connection-cache');
var Messages_MDB = require('../models/ConversationModel');
var UserModel = require('../models/UserModel');
var {ensureAuthentication} = require('../bin/authentication');
var {emailEncode, emailDecode} = require('../bin/encodeDecode');
var {base64ToImageSrc, imageToDisplay} = require('../bin/imageBuffer');


async function getUserProfile(userUniqueKey) {
    try{
        let userProfile = await UserModel.findOne({email: emailDecode(userUniqueKey)});
        if(userProfile){
            let userImageSrc = imageToDisplay(userProfile);

            let userProfileData =
                {
                    userData: {name: userProfile.name, surname: userProfile.surname, uniqueKey: userUniqueKey},
                    userImageSrc: userImageSrc
                }

            return userProfileData;
        }
    }catch (error) {
        throw error
    }
}

function server_io(io) {
    let sender, receiver, message, day, time;

    io.on('connection', socket=>{
        socket.on('join', userData => {
            // User join room

            socket.join(userData.uniqueKey);
        })

        socket.on('MessageInput', inputData => {
            let roomDB, potential_dbRoom1, potential_dbRoom2;

            sender = inputData.sender;
            receiver = inputData.receiver;
            message = inputData.message;
            day = inputData.day;
            time = inputData.time;

            if(message !=='' && day !=='' && time !==''){
                potential_dbRoom1 = 'room:'+sender+':'+receiver;
                potential_dbRoom2 = 'room:'+receiver+':'+sender;

                Messages_MDB.ConversationModel.findOne({
                    $or: [{
                        roomID: potential_dbRoom1
                    }, {
                        roomID: potential_dbRoom2
                    }]
                }).then(roomData => {

                    /***** First: Identify the correct to save chat *****/

                    if(roomData){
                        // Users have already spoken before.
                        // So, use the current room to save chat

                        roomDB = roomData.roomID;
                    }else{
                        // user have never spoken before.
                        // create room to save chat

                        roomDB = potential_dbRoom1;
                        roomData = new Messages_MDB.ConversationModel({
                            roomID: roomDB,
                            user1_id: sender,
                            user2_id: receiver
                        });
                    }

                    /***** Second: Proceed to saving chat in the correct room *****/

                    let insertionDate = Date.now();
                    let newMessage = new Messages_MDB.MessageModel({
                        sender: sender, message: message, sendDay: day, sendTime: time,
                        messageInsertionDate: insertionDate
                    });

                    roomData.roomIsClicked = false;
                    roomData.lastInsertionDate = insertionDate;
                    roomData.messages.push(newMessage);

                    roomData.save(err => {
                        if(err){
                            throw err;
                        }
                        console.log('Message Sent to DB - success');
                    })

                    /***** Third: Send data to both sender and receiver - client side *****/

                    socket.emit('Send Message', {message, day, time, receiver});
                    socket.broadcast.to(receiver).emit('Receive Message', {message, day, time, sender});

                }).catch(error => {
                    console.log('Message An error occurred!');
                    throw error;
                });
            }
        })
    })
    
    router.get('/get-profile/:senderID', ensureAuthentication, async (req, res) => {
        let sender = req.params.senderID;

        try {
            let userProfileData = await getUserProfile(sender);
            res.json(userProfileData)
        } catch (e) {
            res.status(400).send('Error in Receiving message');
        }

    })

    router.get('/get-messages-rooms/:loggedInUserUniqueKey', ensureAuthentication, (req, res) => {
        let loggedInUserUniqueKey = req.params.loggedInUserUniqueKey;
        let loggedInUser = req.user;
        let allRoomsDetails = [];

        let requirement = req.query.requirement;

        Messages_MDB.ConversationModel.find({
            $or: [{
                user1_id: loggedInUserUniqueKey
            }, {
                user2_id: loggedInUserUniqueKey
            }]
        }).sort( { lastInsertionDate: 1 } ).then(async allConversationRooms => {
            if(requirement === 'update'){
                console.log('Room requiring update: ')
                let roomToUpdateIndex = req.query.roomIndex;
                console.log('Room Number: ', roomToUpdateIndex)
                let roomToUpdate = allConversationRooms.reverse()[roomToUpdateIndex];
                roomToUpdate.roomIsClicked = true;

                roomToUpdate.save(err => {
                    if(err){
                        throw err;
                    }
                    res.json('Room Updated');
                })
            }else if(requirement === 'getRooms'){
                if(allConversationRooms){
                    for (const forEachConversatioRoom of allConversationRooms) {
                        let receiver = loggedInUserUniqueKey === forEachConversatioRoom.user1_id
                            ? forEachConversatioRoom.user2_id : forEachConversatioRoom.user1_id;

                        let currentReceiverData = await getUserProfile(receiver);
                        currentReceiverData.userData.roomIsClicked = forEachConversatioRoom.roomIsClicked;
                        currentReceiverData.userData.lastMessageSender = forEachConversatioRoom.messages.slice(-1)[0].sender
                        allRoomsDetails.push(currentReceiverData);
                    }
                    res.json(allRoomsDetails);
                }
            }
            else res.json(undefined);

        }).catch(error=> res.status(400).send('Error in retrieving message'));

    });

    router.get('/get-user-messages/:loggedInUserUniqueKey/:receiverUserUniqueKey', ensureAuthentication, (req, res) => {
        console.log('Get all room messages');
        let loggedInUserKey = req.params.loggedInUserUniqueKey;
        let receivingUserKey = req.params.receiverUserUniqueKey;

        Messages_MDB.ConversationModel.aggregate(
            [
                {$unwind: "$messages"},
                {$match:
                        {
                            $or: [
                                {$and: [{user1_id: loggedInUserKey}, {user2_id: receivingUserKey}]},
                                {$and: [{user1_id: receivingUserKey}, {user2_id: loggedInUserKey}]}
                            ]
                        }
                },{$sort:{'messages.messageInsertionDate': 1 }}
            ]
        ).then(allMessages => {
            res.json(allMessages);
        }).catch(error => {
            res.status(400).send('Error in retrieving message')
        });

    })

    return router;
}

module.exports = {
    router, server_io, getUserProfile
}







/*Messages_MDB.ConversationModel.aggregate(
    [
        {$unwind: "$messages"},
        {$match:
                {
                    $or: [{
                        user1_id: loggedInUser
                    }, {
                        user2_id: loggedInUser
                    }]
                }
        },{$sort:{'messages.messageInsertionDate': -1 }}
    ]
).then(allMessages => {
    console.log('Messages Query')
    console.log(allMessages);
    res.send('Message retrieval success');
}).catch(error => {
    res.status(400).send('Error in retrieving message')
})*/




