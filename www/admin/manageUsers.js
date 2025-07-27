const socket = new WebSocket("wss://nm2207.nus.edu.sg:10998")
let table = document.getElementById('tableOfItems')

let loggedIn = localStorage.getItem('loggedIn')
const logout = document.getElementById('logout');

const hamburger = document.getElementById('hamburger');
const navMenu = document.getElementById('nav-menu');

hamburger.addEventListener('click', () => {
    navMenu.classList.toggle('show');
});


if (loggedIn == false || loggedIn == null) {
    window.location.href = '../index.htm';
}


socket.addEventListener("open", function () {
    let message = {
        type: 'getUsers'
    }
    socket.send(JSON.stringify(message))

    logout.addEventListener('click', () => {
        localStorage.removeItem('loggedIn');
        localStorage.removeItem('email');
        localStorage.removeItem('name');
        window.location.href = "../index.htm";
    });
})

socket.addEventListener('message', function (event) {
    const message = JSON.parse(event.data)
    if (message.type === 'checkLoggedIn') {
        if (!message.info.loggedIn || message.info.email !== 'admin') {
            // Not logged in → redirect to login page
            window.location.href = "../unauthorised.htm";
            return;
        }
        // If logged in, fetch items
        socket.send(JSON.stringify({ type: 'getItems' }));
    }
    else if (message.type === 'getUsers') {
        console.log('Users Received')
        let users = message.info

        if (Object.keys(users).length < 1) {
            let row = table.insertRow()
            let cell = row.insertCell()
            cell.colSpan = 3
            cell.textContent = 'No Items Available'
            cell.style.textAlign = 'center'
            return
        }

        Object.keys(users).forEach(key => {
            const user = users[key];
            let name = user.name;
            let email = user.email;
            let deleteButton = `<button class="delete-btn" data-id="${email}">Delete</button>`;
            let row = table.insertRow();
            row.innerHTML = `
        <td>${name}</td>
        <td>${email}</td>
        <td>${deleteButton}</td>
    `;
        });

        document.querySelectorAll('.delete-btn').forEach(button => {
            button.addEventListener('click', function () {
                const userId = this.getAttribute('data-id')
                let deleteMsg = {
                    type: 'deleteUser',
                    info: { email: userId }
                }
                socket.send(JSON.stringify(deleteMsg))
                // Optionally remove the row from UI
                this.closest('tr').remove()
            })
        })
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
    }
})
