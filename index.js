

import { Resend } from 'resend';
import crypto from 'node:crypto';
import 'dotenv/config'; // Loads .env into process.env
import prompt from 'prompt-sync';
const input = prompt();


const resend = new Resend(process.env.RESEND_API_KEY);



let pendingUsers = {};
let resetTokens = {};

setInterval(() => {
    const now = Date.now();
    for (const token in resetTokens) {
        if (resetTokens[token].expiresAt < now) {
            delete resetTokens[token];
            console.log(`Expired token ${token} removed`);
        }
    }
}, 15 * 60 * 1000); // every 5 minutes

let userData = {}
let itemData = {}
// let userData = {
//     'kohseowmin': {
//         email: 'kohseowmin',
//         name: 'Koh Seow Min',
//         password: '12345678',
//         bidHistory: []
//     }
// };
// let itemData = {
//     "Item 1 ": {
//         itemName: "Item 1 ",
//         itemDesc: "Item 1 Description",
//         price: "20.90",
//         lastBidder: "-",
//         itemImage: null,
//         bidHistory: [],
//         bidOpen: true
//     },
//     "Item 2 ": {
//         itemName: "Item 2 ",
//         itemDesc: "Item 2 Description",
//         price: "15.50",
//         lastBidder: "-",
//         itemImage: null,
//         bidHistory: [],
//         bidOpen: false
//     }
// };


const port = parseInt(input('Enter port number (default 10998): '), 10) || 10998;
const server = Bun.serve({
    port: port,
    certFile: "/etc/ssl/bun/fullchain.pem",
    keyFile: "/etc/ssl/bun/privkey.pem",
    fetch(request, socket) {
        const url = new URL(request.url);

        const isUpgraded = server.upgrade(request);
        if (isUpgraded) return;

        if (url.pathname === "/") {
            return Response.redirect("/index.htm", 302);
        }

        // Handle email verification route
        if (url.pathname === '/verify') {
            const token = url.searchParams.get('token');
            const pending = pendingUsers[token];

            if (pending) {
                userData[pending.email] = pending;
                delete pendingUsers[token];
                return Response.redirect("/verified.htm", 302);
            } else {
                return Response.redirect("/invalid.htm", 400);
            }
        }

        // Serve static files
        const path = "www" + url.pathname;
        const file = Bun.file(path);
        console.log("Request for " + path);
        return new Response(file);
    }

    ,


    websocket: {
        async message(socket, message) {
            console.log(message);
            let data = JSON.parse(message);

            // Registration: store user in pending, send verification email
            if (data.type === 'register') {
                let userInfo = data.info;
                const email = userInfo.email;

                // Check if email already exists in verified users
                if (Object.values(userData).some(user => user.email === email)) {
                    socket.send(JSON.stringify({
                        type: 'emailTaken',
                        info: { message: 'Email already registered.' }
                    }));
                    return;
                }

                // Check if email is already pending verification
                if (Object.values(pendingUsers).some(user => user.email === email)) {
                    socket.send(JSON.stringify({
                        type: 'emailPendingVerification'
                    }));
                    return;
                }

                const token = crypto.randomUUID();

                pendingUsers[token] = {
                    email: email,
                    password: userInfo.password,
                    name: userInfo.name
                        .split(' ')
                        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                        .join(' '),
                    bidHistory: []
                };

                const verifyUrl = `http://localhost:${port}/verify?token=${token}`;

                await resend.emails.send({
                    from: 'Biddle Admin <noreply@kohseowmin.site>',
                    to: email,
                    subject: 'Biddle Account Verification Link',
                    html: `<h3>Biddle Account Verification</h3>
        <p>Hello ${userInfo.name},</p>
        <p>Click <a href="${verifyUrl}">here</a> to verify your account.</p>`
                });

                socket.send(JSON.stringify({ type: 'registered' }));
            }

            else if (data.type === 'signIn') {
                let email = data.info.email;
                let pword = data.info.password;
                let newMessage;

                if (email === 'admin' && pword === '12345678') {
                    socket.data = { loggedIn: true, role: 'admin' };
                    newMessage = { type: 'adminSignIn' };
                } else if (userData[email]) {
                    if (userData[email].password === pword) {
                        socket.data = {
                            loggedIn: true,
                            email: email,
                            name: userData[email].name
                        };
                        newMessage = {
                            type: 'verified',
                            name: userData[email].name
                        };
                    } else {
                        newMessage = { type: 'wrongPW' };
                    }
                } else if (pendingUsers && Object.values(pendingUsers).some(u => u.email === email)) {
                    newMessage = { type: 'notVerified' };
                } else {
                    newMessage = { type: 'noUser' };
                }

                socket.send(JSON.stringify(newMessage), false);
            }

            else if (data.type === 'checkLoggedIn') {
                const email = data.info?.email;
                let loggedIn = false;

                if (email === 'admin') {
                    loggedIn = true;
                    console.log('loggedInTrue Admin')
                } else if (email && userData[email]) {
                    loggedIn = true;
                    console.log('loggedInTrue')
                }

                let newMessage = {
                    type: 'checkLoggedIn',
                    info: {
                        loggedIn: loggedIn,
                        email: email
                    }
                };
                socket.send(JSON.stringify(newMessage), false);
            }


            else if (data.type === 'addItem') {

                let item = data.info;
                let imageUrl = null;

                if (item.image) {
                    const base64Data = item.image.split(",")[1];
                    const filename = `${Date.now()}-${item.itemName.replace(/\s+/g, '-')}.png`;
                    Bun.write(`www/images/${filename}`, Buffer.from(base64Data, "base64"));
                    imageUrl = `/images/${filename}`;
                }

                itemData[item.itemName] = {
                    itemName: item.itemName,
                    itemDesc: item.itemDesc,
                    price: item.price,
                    lastBidder: item.lastBidder,
                    itemImage: imageUrl,
                    bidOpen: item.bidOpen,
                    bidHistory: []
                };

                console.log(itemData[item.itemName]);
                socket.send(JSON.stringify({ type: 'addItem' }), false); // 
            }

            else if (data.type === 'getItems') {
                socket.send(JSON.stringify({
                    type: 'getItems',
                    info: itemData
                }), false); // 
            }

            else if (data.type === 'deleteItem') {

                let item = data.info;
                delete itemData[item.itemName];
                console.log(itemData);
                socket.send(JSON.stringify({ type: 'deleteItem' }), false); //
            }

            else if (data.type === 'bidItem') {
                let item = data.info;

                if (itemData[item.itemName].bidOpen == false) {
                    socket.send(JSON.stringify({
                        type: 'bidClosed',
                        info: {
                            itemName: item.itemName,
                            lastBidder: item.lastBidder,
                            price: item.price
                        }
                    }), false); // 

                    return

                }
                itemData[item.itemName].lastBidder = item.lastBidder;
                itemData[item.itemName].price = item.price;

                const now = new Date();
                let time = now.toLocaleString()

                let userHistory = {
                    itemName: item.itemName,
                    itemDesc: itemData[item.itemName].itemDesc,
                    price: item.price,
                    timeBidded: time,
                    itemImage: itemData[item.itemName].itemImage,
                }

                let itemHistory = {
                    name: userData[item.email].name,
                    email: item.email,
                    timeBidded: time,
                }

                userData[item.email].bidHistory.push(userHistory)
                itemData[item.itemName].bidHistory.push(itemHistory)

                console.log(itemData[item.itemName]);
                console.log(userData[item.email]);


                socket.send(JSON.stringify({
                    type: 'bidItem',
                    info: {
                        lastBidder: item.lastBidder,
                        price: item.price
                    }
                }), false); // 

                let notification = {
                    type: 'notification',
                    info: {
                        lastBidder: item.lastBidder,
                        price: item.price,
                        item: item.itemName
                    }
                }

                socket.publish('user', JSON.stringify(notification))
            }

            else if (data.type === 'getUsers') {
                socket.send(JSON.stringify({
                    type: 'getUsers',
                    info: userData
                }), false); // 
            }

            else if (data.type === 'deleteUser') {

                let user = data.info;
                delete userData[user.email];
                console.log(userData);
                socket.send(JSON.stringify({ type: 'deleteUser' }), false); // 
            }

            else if (data.type === 'getItem') {
                let itemname = data.info;
                console.log(itemData[itemname]);
                socket.send(JSON.stringify({
                    type: 'getItem',
                    info: itemData[itemname]
                }), false); // 
            }
            else if (data.type === 'getBidHistory') {

                let email = data.info.email

                socket.send(JSON.stringify({
                    type: 'getBidHistory',
                    info: {
                        bidHistory: userData[email].bidHistory
                    }
                }), false); //


            }
            else if (data.type == 'updateProfile') {
                let info = data.info;
                let email = info.email;

                // Migrate user data
                if (userData[email].name !== info.newName) {
                    userData[email].name = info.newName
                    console.log(`new user name: ${JSON.stringify(userData[email])}`)
                }

                if (userData[email].email !== info.newEmail) {
                    let oldData = userData[email]
                    userData[info.newEmail] = oldData
                    userData[info.newEmail].email = info.newEmail
                    console.log(`new account data: ${userData[info.newEmail]}`)
                    delete userData[email]
                }

                socket.send(JSON.stringify({
                    type: 'updateProfile',
                    info: {
                        email: info.newEmail,
                        name: info.newName
                    }
                }), false);
            }


            else if (data.type == 'updatePassword') {
                let info = data.info
                let email = info.email
                let password = userData[email].password
                let newMessage

                if (info.cPassword !== password) {

                    newMessage = {
                        type: 'wrongCPW'
                    }

                } else if (info.newPassword == password) {
                    newMessage = {
                        type: 'samePW'
                    }
                } else {

                    userData[email].password = info.newPassword

                    newMessage = {
                        type: 'updatePassword'
                    }

                }

                console.log(userData)
                socket.send(JSON.stringify(newMessage), false); //

            }
            else if (data.type == 'closeBid') {
                let info = data.info
                itemData[info.itemName].bidOpen = false
                console.log(itemData[info.itemName].openBid)

                let newMessage = {
                    type: 'closeBid',
                    info: {
                        itemName: info.itemName
                    }
                }

                console.log(newMessage)

                socket.send(JSON.stringify(newMessage), false)
                socket.publish('user', JSON.stringify(newMessage))

            }
            else if (data.type == 'openBid') {
                let info = data.info
                itemData[info.itemName].bidOpen = true
                console.log(itemData[info.itemName].bidOpen)

                let newMessage = {
                    type: 'openBid',
                    info: {
                        itemName: info.itemName
                    }
                }

                console.log(newMessage)

                socket.send(JSON.stringify(newMessage), false)
                socket.publish('user', JSON.stringify(newMessage))

            }

            else if (data.type === 'recoverPassword') {
                const info = data.info;
                let newMessage;

                if (!userData[info.email]) {
                    newMessage = {
                        type: 'noUser'
                    };
                    socket.send(JSON.stringify(newMessage), false);
                    return;
                }

                // Generate secure token and expiry (15 mins)
                const token = crypto.randomUUID();
                const expiresAt = Date.now() + 15 * 60 * 1000;
                resetTokens[token] = { email: info.email, expiresAt };

                // Construct reset link
                const resetLink = `http://localhost:${port}/recoverPassword.htm?token=${token}&email=${encodeURIComponent(info.email)}`;

                // Send reset email
                try {
                    await resend.emails.send({
                        from: 'Biddle Admin <noreply@kohseowmin.site>',
                        to: info.email,
                        subject: 'Biddle Password Reset Request',
                        html: `
                <h3>Password Reset</h3>
                <p>Hello,</p>
                <p>We received a request to reset your password. Click the link below:</p>
                <a href="${resetLink}">Reset Password</a>
                <p>This link is valid for 15 minutes.</p>
            `
                    });

                    newMessage = {
                        type: 'recoverPassword'
                    };
                } catch (error) {
                    console.error("Resend error:", error);
                    newMessage = {
                        type: 'emailFailed',
                        error: error.message
                    };
                }

                socket.send(JSON.stringify(newMessage), false);
            }
            else if (data.type === 'resetPassword') {
                const info = data.info;
                const { token, email, newPassword } = info;

                const tokenData = resetTokens[token];
                let newMessage;

                // Validate token
                if (!tokenData || tokenData.email !== email || Date.now() > tokenData.expiresAt) {
                    newMessage = {
                        type: 'invalidOrExpiredToken'
                    };
                    socket.send(JSON.stringify(newMessage), false);
                    return;
                }

                // Update password and clean up token
                userData[email].password = newPassword;
                delete resetTokens[token];

                newMessage = {
                    type: 'resetPassword'
                };
                socket.send(JSON.stringify(newMessage), false);
            }



        },

        open(socket) {
            socket.subscribe('user');
        },

        close(socket) {
            socket.unsubscribe('user');
        }
    }
});

console.log("socket is running on port " + port);
