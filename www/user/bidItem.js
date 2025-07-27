const socket = new WebSocket("wss://nm2207.nus.edu.sg:10998")

// DOM Elements
const itemNameF = document.getElementById('itemNameF');
const itemDesc = document.getElementById('descF');
const lastBidder = document.getElementById('lastBidderF');
const currentBid = document.getElementById('currentBidF');
const image = document.getElementById('imgF');
const submit = document.getElementById('submit');
const bid = document.getElementById('bid');
const bidError = document.getElementById('bid-error');
const bidSuccess = document.getElementById('bid-success');

// Local Storage
const itemname = localStorage.getItem('itemName');
const name = localStorage.getItem('name');
let email = localStorage.getItem('email');
let loggedIn = localStorage.getItem('loggedIn');

const hamburger = document.getElementById('hamburger');
const navMenu = document.getElementById('nav-menu');

hamburger.addEventListener('click', () => {
    navMenu.classList.toggle('show');
});


// Prevent access if not logged in
window.addEventListener('DOMContentLoaded', () => {
    if (loggedIn !== 'true' || !email) {
        window.location.href = "../index.htm";
    }
});
let currentBidAmt = 0;

socket.addEventListener('open', function () {
    console.log('Connected: requesting item', itemname);

    // Request item details
    socket.send(JSON.stringify({
        type: 'getItem',
        info: itemname
    }));

    logout.addEventListener('click', () => {
        localStorage.removeItem('loggedIn');
        localStorage.removeItem('email');
        localStorage.removeItem('name');
        window.location.href = "../index.htm";
    });

    submit.addEventListener('click', function (event) {
        event.preventDefault();
        bidError.textContent = '';
        bidSuccess.textContent = '';

        let bidValue = parseFloat(bid.value);

        // Validate bid
        if (isNaN(bidValue) || !/^\d+(\.\d{1,2})?$/.test(bid.value)) {
            bidError.textContent = 'Please enter a valid price (max 2 decimals)';
            return;
        }

        if (bidValue <= currentBidAmt) {
            bidError.textContent = 'Your bid must be higher than the current bid amount';
            return;
        }

        // Send bid to server
        socket.send(JSON.stringify({
            type: 'bidItem',
            info: {
                itemName: itemname,
                price: parseFloat(bidValue).toFixed(2),
                lastBidder: name,
                email: email
            }
        }));

        bid.value = '';
    });
});

socket.addEventListener('message', function (event) {
    let message = JSON.parse(event.data);

    if (message.type === 'getItem') {
        let item = message.info;
        currentBidAmt = parseFloat(item.price);

        itemNameF.textContent = item.itemName;
        itemDesc.textContent = item.itemDesc;
        lastBidder.textContent = item.lastBidder || 'None';
        currentBid.textContent = '$' + parseFloat(item.price).toFixed(2);

        if (item.itemImage) {
            image.src = item.itemImage;
            image.alt = item.itemName;
        } else {
            image.src = '/resources/placeholder.jpg';
            image.alt = 'No Image Available';
        }
    }
    else if (message.type == 'openBid') {
        let info = message.info;
        let notificationMessage = `Bids for ${info.itemName} has opened.`;
        const notifArea = document.getElementById('notificationArea');
        if (notifArea) {
            notifArea.textContent = notificationMessage;
            notifArea.classList.remove('hidden');

            // Slide in
            setTimeout(() => {
                notifArea.classList.add('show');
            }, 10);

            // Slide out after 4s
            setTimeout(() => {
                notifArea.classList.remove('show');
                setTimeout(() => notifArea.classList.add('hidden'), 500);
            }, 4000);
        }

    }

    else if (message.type == 'closeBid') {
        let info = message.info;
        let notificationMessage = `Bids for ${info.itemName} has closed.`;
        const notifArea = document.getElementById('notificationArea');
        if (notifArea) {
            notifArea.textContent = notificationMessage;
            notifArea.classList.remove('hidden');

            // Slide in
            setTimeout(() => {
                notifArea.classList.add('show');
            }, 10);

            // Slide out after 4s
            setTimeout(() => {
                notifArea.classList.remove('show');
                setTimeout(() => notifArea.classList.add('hidden'), 500);
            }, 4000);
        }

    }

    else if (message.type === 'bidItem') {
        let bidDetails = message.info;
        lastBidder.textContent = bidDetails.lastBidder;
        currentBid.textContent = '$' + parseFloat(bidDetails.price).toFixed(2);
        bidSuccess.textContent = 'Bid Successful!';
    }

    else if (message.type === 'notification') {
        let info = message.info;
        if (info.lastBidder == name) {
            return
        }

        let notificationMessage = `${info.lastBidder} has bidded for ${info.item} for $${info.price}.`;

        const notifArea = document.getElementById('notificationArea');
        if (notifArea) {
            notifArea.textContent = notificationMessage;
            notifArea.classList.remove('hidden');

            // Slide in
            setTimeout(() => {
                notifArea.classList.add('show');
            }, 10);

            // Slide out after 4s
            setTimeout(() => {
                notifArea.classList.remove('show');
                setTimeout(() => notifArea.classList.add('hidden'), 500);
            }, 4000);
        }
    }
    else if (message.type == 'bidClosed') {
        bidSuccess.textContent = '';
        bidError.textContent = 'Bids for this item has closed';

    }
});
