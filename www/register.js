const socket = new WebSocket("wss://nm2207.nus.edu.sg:10998")
const name = document.getElementById('name')
const email = document.getElementById('email')
const pword = document.getElementById('pword')
const cpword = document.getElementById('cpword')
const submitBtn = document.getElementById('btn')


const nameError = document.getElementById('name-error')
const emailError = document.getElementById('email-error')
const pwordError = document.getElementById('pword-error')
const cpwordError = document.getElementById('cpword-error')

const nameSuccess = document.getElementById('name-success')
const emailSuccess = document.getElementById('email-success')
const pwordSuccess = document.getElementById('pword-success')
const cpwordSuccess = document.getElementById('cpword-success')

socket.addEventListener("open", function () {
    console.log("Socket is open and ready!")
    submitBtn.addEventListener("click", function (event) {
        event.preventDefault(); // prevents form from reloading the page
        nameError.textContent = ''
        emailError.textContent = ''
        pwordError.textContent = ''
        cpwordError.textContent = ''

        if (name.value == '' || email.value == '' || pword.value == '' || cpword.value == '') {
            if (name.value == '') {
                console.log('hello')
                nameError.textContent = 'Name is required'
            }

            if (email.value == "") {
                emailError.textContent = 'Email is required'
            }

            if (pword.value == "") {
                pwordError.textContent = 'Password is required'

            }

            if (cpword.value == "") {
                cpwordError.textContent = 'Passwords does not match'
            }

        } else if (pword.value !== cpword.value) {
            cpwordError.textContent = 'Passwords does not match'

        } else if (pword.value.length < 8) {
            pwordError.textContent = 'Password needs to be more than 8 characters'

        } else {
            const userData = {
                type: "register",
                info: {
                    name: name.value.toLowerCase(),
                    email: email.value.toLowerCase(),
                    password: pword.value
                }
            };

            socket.send(JSON.stringify(userData));
            console.log('Registering...')
        }
    });
})

socket.addEventListener("message", function (event) {
    const message = JSON.parse(event.data)
    console.log(message)
    if (message.type == 'registered') {
        console.log('registered')
        name.value = ''
        email.value = ''
        pword.value = ''
        cpword.value = ''
        nameSuccess.textContent = 'Account registered successfully! Please check your email for verification.'


    }
    else if (message.type == 'emailTaken') {
        email.value = ''
        emailError.textContent = 'Email is already taken'
    }
    else if (message.type == 'emailPendingVerification') {
        email.value = ''
        emailError.textContent = 'Email has already been registered. Please check your email for verification.'
    }
})