const socket = new WebSocket("wss://nm2207.nus.edu.sg:10998")

// DOM Elements
let logout = document.getElementById('logout');
let addItemBtn = document.getElementById('addItemBtn');
let table = document.getElementById('tableOfItems');
let tableBody = table.querySelector('tbody');

// Wait for DOM to load before doing localStorage checks
window.addEventListener('DOMContentLoaded', () => {
    const email = localStorage.getItem('email');
    const loggedIn = localStorage.getItem('loggedIn');

    if (loggedIn !== 'true') {
        window.location.href = "../index.htm";
    }
});

const hamburger = document.getElementById('hamburger');
const navMenu = document.getElementById('nav-menu');

hamburger.addEventListener('click', () => {
    navMenu.classList.toggle('show');
});


// Handle WebSocket errors
socket.addEventListener("error", (err) => {
    console.error("WebSocket error:", err);
    alert("WebSocket connection failed. Please try again later.");
});

socket.addEventListener("close", () => {
    console.warn("WebSocket connection closed.");
});

socket.addEventListener("open", function () {
    console.log('Homepage connected');

    const email = localStorage.getItem('email');

    logout.addEventListener('click', () => {
        localStorage.removeItem('loggedIn');
        localStorage.removeItem('email');
        localStorage.removeItem('name');
        window.location.href = "../index.htm";
    });

    // Ask server to verify session
    socket.send(JSON.stringify({
        type: 'checkLoggedIn',
        info: { email }
    }));
});

socket.addEventListener('message', function (event) {
    let message;
    try {
        message = JSON.parse(event.data);
    } catch (err) {
        console.error("Invalid message received:", event.data);
        return;
    }

    if (message.type === 'checkLoggedIn') {
        if (!message.info.loggedIn) {
            window.location.href = "../index.htm";
            return;
        }

        socket.send(JSON.stringify({ type: 'getItems' }));
    }

    else if (message.type === 'notification') {
        showNotification(`${message.info.lastBidder} has bidded for ${message.info.item} for $${message.info.price}.`);
        refreshItems();
    }

    else if (message.type === 'openBid') {
        showNotification(`Bids for ${message.info.itemName} have opened.`);
        refreshItems();
    }

    else if (message.type === 'closeBid') {
        showNotification(`Bids for ${message.info.itemName} have closed.`);
        refreshItems();
    }

    else if (message.type === 'getItems') {
        renderItems(message.info);
    }
});

function showNotification(text) {
    const notifArea = document.getElementById('notificationArea');
    if (!notifArea) return;

    notifArea.textContent = text;
    notifArea.classList.remove('hidden');

    // Slide in
    setTimeout(() => notifArea.classList.add('show'), 10);

    // Slide out after 4 seconds
    setTimeout(() => {
        notifArea.classList.remove('show');
        setTimeout(() => notifArea.classList.add('hidden'), 500);
    }, 4000);
}

function refreshItems() {
    tableBody.innerHTML = '';
    socket.send(JSON.stringify({ type: 'getItems' }));
}

function renderItems(items) {
    console.log('Items received:', items);

    tableBody.innerHTML = ''; // Clear existing

    if (Object.keys(items).length === 0) {
        let row = tableBody.insertRow();
        let cell = row.insertCell();
        cell.colSpan = 6;
        cell.textContent = 'No Items Available';
        cell.style.textAlign = 'center';
        return;
    }

    Object.keys(items).forEach(key => {
        const item = items[key];
        const itemName = item.itemName || "Unnamed";
        const itemDesc = item.itemDesc || "";
        const price = `$ ${item.price ?? "0.00"}`;
        const lastBidder = item.lastBidder || "-";
        const image = item.itemImage || "";
        const bidOpen = item.bidOpen;

        const imageTag = image
            ? `<img src="${image}" alt="${itemName}" height="60">`
            : `<img src="../resources/placeholder.jpg" alt="No Image" height="60">`;

        const bidButton = bidOpen
            ? `<button class="bid-btn" data-id="${key}">Bid</button>`
            : '<i>Bid Closed</i>';

        let row = tableBody.insertRow();

        const cells = [
            { label: "Image", content: imageTag },
            { label: "Item Name", content: itemName },
            { label: "Item Description", content: itemDesc },
            { label: "Last Bid Price", content: price },
            { label: "Last Bidder", content: lastBidder },
            { label: "Bid", content: bidButton }
        ];

        cells.forEach(cellData => {
            const cell = row.insertCell();
            cell.setAttribute('data-label', cellData.label);
            cell.innerHTML = cellData.content;
        });
    });

    // Add bid button click handlers
    document.querySelectorAll('.bid-btn').forEach(button => {
        button.addEventListener('click', function () {
            const itemId = this.getAttribute('data-id');
            localStorage.setItem('itemName', itemId);
            window.location.href = "./bidItem.htm";
        });
    });
}

