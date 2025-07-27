const socket = new WebSocket("wss://nm2207.nus.edu.sg:10998")
const email = document.getElementById('email');
const cemail = document.getElementById('cemail');
const btn = document.getElementById('btn');
const emailError = document.getElementById('email-error');
const emailSuccess = document.getElementById('email-success');
const cemailError = document.getElementById('cemail-error');


socket.addEventListener("open", () => {
    console.log("Socket open, ready for login.");

    btn.addEventListener("click", (event) => {
        event.preventDefault();
        emailError.textContent = '';
        cemailError.textContent = '';

        if (!email.value || !cemail.value) {
            emailError.textContent = 'Please fill in your email'
            cemailError.textContent = 'Please confirm your email'
            return;
        }

        if (email.value !== cemail.value) {
            cemailError.textContent = 'Your emails do not match.'
            return;
        }

        const message = {
            type: "recoverPassword",
            info: {
                email: email.value.toLowerCase(),
            }
        };

        email.value = ''
        cemail.value = ''

        socket.send(JSON.stringify(message));
        console.log('Sending Password Change Link');
    });
});

socket.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    console.log('Message from server:', message);

    if (message.type === 'recoverPassword') {

        emailSuccess.textContent = 'Password reset link sent to email!'

    }
    else if (message.type === 'noUser') {
        emailError.textContent = 'User does not exist';
    }
    else if (message.type === 'emailFailed') {
        emailError.textContent = 'Password reset error';
    }

});
