
const socket = new WebSocket("wss://nm2207.nus.edu.sg:10998")
const password = document.getElementById('password');
const cpassword = document.getElementById('cpassword');
const btn = document.getElementById('btn');
const passwordError = document.getElementById('password-error');
const cpasswordError = document.getElementById('cpassword-error');
const passwordSuccess = document.getElementById('password-success');

// 1. Get token and email from URL query
const params = new URLSearchParams(window.location.search);
const token = params.get("token");
const email = params.get("email");

socket.addEventListener("open", () => {
    console.log("Socket open for password reset.");

    btn.addEventListener("click", (event) => {
        event.preventDefault();

        // Clear messages
        passwordError.textContent = '';
        cpasswordError.textContent = '';
        passwordSuccess.textContent = '';

        // Basic checks
        if (!password.value || !cpassword.value) {
            passwordError.textContent = 'Please enter your new password.';
            return;
        }

        if (password.value.length < 8) {
            passwordError.textContent = 'Password must be at least 8 characters.';
            return;
        }

        if (password.value !== cpassword.value) {
            cpasswordError.textContent = 'Passwords do not match.';
            return;
        }

        const message = {
            type: "resetPassword",
            info: {
                email: email,
                token: token,
                newPassword: password.value
            }
        };

        socket.send(JSON.stringify(message));
        console.log("Sent password reset message.");
    });
});

socket.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    console.log("Server:", message);

    if (message.type === "resetPassword") {
        password.value = ''
        cpassword.value = ''
        passwordSuccess.textContent = "Password reset successful!";
    } else if (message.type === "invalidOrExpiredToken") {
        password.value = ''
        cpassword.value = ''
        passwordError.textContent = "This link has expired or is invalid.";
    }
});

