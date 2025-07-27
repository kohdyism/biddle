const socket = new WebSocket("wss://nm2207.nus.edu.sg:10998")
const addItemBtn = document.getElementById('addItemBtn');
const table = document.getElementById('tableOfItems');
const logout = document.getElementById('logout');
let tableBody = table.querySelector('tbody');

const hamburger = document.getElementById('hamburger');
const navMenu = document.getElementById('nav-menu');

hamburger.addEventListener('click', () => {
    navMenu.classList.toggle('show');
});

socket.addEventListener("open", function () {
    console.log('Admin homepage connected');

    // 1. Check if logged in
    socket.send(JSON.stringify({
        type: 'checkLoggedIn',
        info: { email: localStorage.getItem('email') }
    }));


    // 2. Setup buttons after socket opens
    addItemBtn.addEventListener('click', () => {
        window.location.href = "./addItem.htm";
    });
    logout.addEventListener('click', () => {
        localStorage.removeItem('loggedIn');
        localStorage.removeItem('email');
        localStorage.removeItem('name');
        window.location.href = "../index.htm";
    });


});

socket.addEventListener('message', function (event) {
    const message = JSON.parse(event.data);

    if (message.type === 'checkLoggedIn') {
        if (!message.info.loggedIn || message.info.email !== 'admin') {
            // Not logged in → redirect to login page
            window.location.href = "../unauthorised.htm";
            return;
        }
        // If logged in, fetch items
        socket.send(JSON.stringify({ type: 'getItems' }));
    }

    else if (message.type === 'notification') {
        let info = message.info;
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

        // 🧹 Clear the table
        tableBody.innerHTML = '';

        // 🔁 Re-fetch latest items
        socket.send(JSON.stringify({ type: 'getItems' }));
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

    else if (message.type === 'getItems') {
        console.log('Items received:', message.info);
        const items = message.info;

        // Clear existing table rows
        tableBody.innerHTML = '';

        if (Object.keys(items).length < 1) {
            let row = tableBody.insertRow();
            let cell = row.insertCell();
            cell.colSpan = 7;
            cell.textContent = 'No Items Available';
            cell.style.textAlign = 'center';
            return;
        }

        Object.keys(items).forEach(key => {
            const item = items[key];
            const itemName = item.itemName;
            const itemDesc = item.itemDesc;
            const price = item.price;
            const lastBidder = item.lastBidder;
            const image = item.itemImage || '';
            const bidOpen = item.bidOpen;

            const imageTag = image ? `<img src="${image}" alt="${itemName}" height="60">` : 'No Image';
            const deleteButton = `<button class="delete-btn" data-id="${itemName}">Delete</button>`;

            const bidOpenToggle = bidOpen
                ? `<label class="switch">
                    <input type="checkbox" checked class='toggle' data-id="${itemName}">
                    <span class="slider round"></span>
               </label>`
                : `<label class="switch">
                    <input type="checkbox" class='toggle' data-id="${itemName}">
                    <span class="slider round"></span>
               </label>`;

            let row = tableBody.insertRow();

            const cells = [
                { label: "Image", content: imageTag },
                { label: "Item Name", content: itemName },
                { label: "Item Description", content: itemDesc },
                { label: "Last Bid Price", content: price },
                { label: "Last Bidder", content: lastBidder },
                { label: "Bid Open?", content: bidOpenToggle },
                { label: "Delete", content: deleteButton },
            ];

            cells.forEach(cellData => {
                const cell = row.insertCell();
                cell.setAttribute('data-label', cellData.label);
                cell.innerHTML = cellData.content;
            });
        });

        // Attach delete button listeners
        document.querySelectorAll('.delete-btn').forEach(button => {
            button.addEventListener('click', function () {
                const itemId = this.getAttribute('data-id');
                if (confirm(`Delete item "${itemId}"?`)) {
                    socket.send(JSON.stringify({
                        type: 'deleteItem',
                        info: { itemName: itemId }
                    }));
                    this.closest('tr').remove();
                }
            });
        });

        // Attach toggle switch listeners
        document.querySelectorAll('.toggle').forEach(toggle => {
            toggle.addEventListener('change', function () {
                const itemId = this.getAttribute('data-id');
                if (!toggle.checked) {
                    if (confirm(`Close Bid for "${itemId}"?`)) {
                        socket.send(JSON.stringify({
                            type: 'closeBid',
                            info: { itemName: itemId }
                        }));
                    } else {
                        toggle.checked = true;
                    }
                } else {
                    if (confirm(`Open Bid for "${itemId}"?`)) {
                        socket.send(JSON.stringify({
                            type: 'openBid',
                            info: { itemName: itemId }
                        }));
                    } else {
                        toggle.checked = false;
                    }
                }
            });
        });
    }
})
