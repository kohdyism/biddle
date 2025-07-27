const socket = new WebSocket("wss://nm2207.nus.edu.sg:10998")
const email = document.getElementById('email');
const pword = document.getElementById('pword');
const loginBtn = document.getElementById('btn');
const emailError = document.getElementById('email-error');
const pwordError = document.getElementById('pword-error');

localStorage.removeItem('name')

localStorage.removeItem('email')

localStorage.removeItem('loggedIn')

socket.addEventListener("open", () => {
    console.log("Socket open, ready for login.");

    loginBtn.addEventListener("click", (event) => {
        event.preventDefault();
        emailError.textContent = '';
        pwordError.textContent = '';

        if (!email.value || !pword.value) {
            alert('Please fill in all form fields.');
            return;
        }

        const userData = {
            type: "signIn",
            info: {
                email: email.value.toLowerCase(),
                password: pword.value
            }
        };

        socket.send(JSON.stringify(userData));
        console.log('Signing in...');
    });
});

socket.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    console.log('Message from server:', message);

    if (message.type === 'verified') {
        localStorage.setItem('loggedIn', true);
        localStorage.setItem('name', message.name);
        localStorage.setItem('email', email.value.toLowerCase())
        window.location.href = "./user/homepage.htm";
    }
    else if (message.type === 'adminSignIn') {
        localStorage.setItem('loggedIn', true);
        localStorage.setItem('name', 'admin');
        localStorage.setItem('email', 'admin');
        window.location.href = "/admin/homepage.htm";

    }
    else if (message.type === 'wrongPW') {
        pwordError.textContent = 'Invalid Password';
    }

    else if (message.type === 'noUser') {
        emailError.textContent = 'User does not exist';
    }

    else if (message.type === 'notVerified') {
        emailError.textContent = "Please verify your account in your email"
    }
});
