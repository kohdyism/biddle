const socket = new WebSocket("wss://nm2207.nus.edu.sg:10998")

// DOM Elements
const submit = document.getElementById('submit');
const logout = document.getElementById('logout');
const changePassword = document.getElementById('changePassword');

const nameF = document.getElementById('nameF');
const nameError = document.getElementById('name-error');
const nameSuccess = document.getElementById('name-success');

const emailF = document.getElementById('emailF');
const emailError = document.getElementById('email-error');
const emailSuccess = document.getElementById('email-success');

const cPasswordF = document.getElementById('cPasswordF');
const cPasswordError = document.getElementById('cPassword-error');
const cPasswordSuccess = document.getElementById('cPassword-success');

const nPasswordF = document.getElementById('nPasswordF');
const nPasswordError = document.getElementById('nPassword-error');
const nPasswordSuccess = document.getElementById('nPassword-success');
const changesSuccess = document.getElementById('changes-success');

// Local Storage
let name = localStorage.getItem('name');
let email = localStorage.getItem('email');
const loggedIn = localStorage.getItem('loggedIn');

const hamburger = document.getElementById('hamburger');
const navMenu = document.getElementById('nav-menu');

hamburger.addEventListener('click', () => {
    navMenu.classList.toggle('show');
});


// Prevent access if not logged in
if (!loggedIn || loggedIn !== 'true' || !email || !name) {
    window.location.href = "../index.htm";
}

socket.addEventListener('open', function () {

    nameF.value = name
    emailF.value = email

    logout.addEventListener('click', () => {
        localStorage.removeItem('loggedIn');
        localStorage.removeItem('email');
        localStorage.removeItem('name');
        window.location.href = "../index.htm";
    });

    submit.addEventListener('click', function (event) {
        event.preventDefault();
        console.log(emailF.value)
        if (!nameF.value.trim() || !emailF.value.trim()) {
            alert('Name and email must not be empty.');
            return;
        }
        else if (confirm('Are you sure you want to update your profile information?')) {
            nameError.textContent = '';
            nameSuccess.textContent = '';
            emailError.textContent = '';
            emailSuccess.textContent = '';

            // Validate bid
            console.log(nameF.value)
            console.log(emailF.value)
            console.log(email)

            // Send bid to server
            socket.send(JSON.stringify({
                type: 'updateProfile',
                info: {
                    email: email,
                    newEmail: emailF.value,
                    newName: nameF.value
                }
            }));

            console.log('updating...')

        }

    });


    changePassword.addEventListener('click', function (event) {
        event.preventDefault();
        nPasswordError.textContent = ''
        cPasswordError.textContent = ''
        nPasswordSuccess.textContent = ''
        if (confirm('Are you sure you want to update your password?')) {
            if (cPasswordF.value === '') {
                cPasswordError.textContent = 'Please enter your current password.';
                return;
            }
            else if (nPasswordF.value.length < 8) {
                nPasswordError.value = 'Password needs to be at leasy 8 characters long.'
            } else {
                socket.send(JSON.stringify({
                    type: 'updatePassword',
                    info: {
                        email: email,
                        cPassword: cPasswordF.value,
                        newPassword: nPasswordF.value,
                    }
                }));
            }

        }
    })
});

socket.addEventListener('message', function (event) {
    let message = JSON.parse(event.data);

    if (message.type === 'updateProfile') {
        localStorage.setItem('name', message.info.name)
        localStorage.setItem('email', message.info.email)
        console.log(localStorage.getItem('name'))
        console.log(localStorage.getItem('email'))
        nameSuccess.textContent = 'Succesfully updated!'
        emailSuccess.textContent = 'Successfully updated!'

    }
    else if (message.type === 'wrongCPW') {
        cPasswordError.textContent = 'Your current password is wrong'
    } else if (message.type === 'samePW') {
        nPasswordError.textContent = 'Your new password cannot be the same as your old password'
    } else if (message.type === 'updatePassword') {
        nPasswordSuccess.textContent = 'Password has been changed!'
    } else if (message.type === 'notification') {
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

});
