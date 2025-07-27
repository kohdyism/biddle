const socket = new WebSocket("wss://nm2207.nus.edu.sg:10998")

let submit = document.getElementById('submit');
let itemName = document.getElementById('itemNameF');
let itemDesc = document.getElementById('itemDescF');
let price = document.getElementById('priceF');
let uploadImage = document.getElementById('uploadImageF');
let bidOpen = document.getElementById('bidOpen');

const logout = document.getElementById('logout');

let itemnameError = document.getElementById('itemname-error');
let itemdescError = document.getElementById('itemdesc-error');
let priceError = document.getElementById('price-error');

// LocalStorage check
const loggedIn = localStorage.getItem('loggedIn');
const email = localStorage.getItem('email');

const hamburger = document.getElementById('hamburger');
const navMenu = document.getElementById('nav-menu');

hamburger.addEventListener('click', () => {
    navMenu.classList.toggle('show');
});


if (loggedIn !== 'true' || !email) {
    window.location.href = '../index.htm';
}

socket.addEventListener('open', function () {
    console.log('connected');

    // Step 1: Verify with server
    socket.send(JSON.stringify({
        type: 'checkLoggedIn',
        info: { email }
    }));

    logout.addEventListener('click', () => {
        localStorage.removeItem('loggedIn');
        localStorage.removeItem('email');
        localStorage.removeItem('name');
        window.location.href = "../index.htm";
    });


    submit.addEventListener('click', function (event) {
        event.preventDefault();

        // Clear previous errors
        itemnameError.textContent = '';
        itemdescError.textContent = '';
        priceError.textContent = '';

        // Form validation
        if (itemName.value === '' || itemDesc.value === '' || price.value === '' || !/^\d+(\.\d{1,2})?$/.test(price.value)) {
            if (itemName.value === '') itemnameError.textContent = 'This field is required';
            if (itemDesc.value === '') itemdescError.textContent = 'This field is required';
            if (price.value === '') {
                priceError.textContent = 'This field is required';
            } else if (!/^\d+(\.\d{1,2})?$/.test(price.value)) {
                priceError.textContent = 'Please enter a valid price (e.g. 10.99)';
            }

            return;
        }

        // Check for file
        const file = uploadImage.files[0];

        if (file) {
            const reader = new FileReader();

            reader.onload = function () {
                const base64Image = reader.result;
                sendMessage(base64Image);
            };

            reader.readAsDataURL(file);
        } else {
            sendMessage(null);
        }
    });

    function sendMessage(base64Image) {
        const message = {
            type: 'addItem',
            info: {
                itemName: itemName.value,
                itemDesc: itemDesc.value,
                price: price.value,
                image: base64Image,
                lastBidder: '-',
                bidOpen: bidOpen.checked
            }
        };

        console.log('sending:', message);
        socket.send(JSON.stringify(message));
    }
});

socket.addEventListener('message', function (event) {
    const message = JSON.parse(event.data);

    if (message.type === 'checkLoggedIn') {
        if (!message.info.loggedIn || message.info.email !== 'admin') {
            // Not logged in → redirect to login page
            window.location.href = "../unauthorised.htm";
            return;
        }
    }

    if (message.type === 'addItem') {
        window.location.href = "./homepage.htm";
    }
});
