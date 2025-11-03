const socket = io('http://localhost:8000');

const loginOverlay = document.getElementById('login-overlay');
const loginForm = document.getElementById('login-form');

const form = document.getElementById('send-container');
const messageInput = document.getElementById('messageInp');
const messageContainer = document.querySelector(".screenbox");

const append = (chat, position)=>{
    const messageElement = document.createElement('div');
    messageElement.innerHTML = chat;
    messageElement.classList.add('chat')
    messageElement.classList.add(position);
    messageContainer.append(messageElement);
}

// display chat history
socket.on('chat-history', messages => {
    messages.forEach(m => {
        if (m.name === username) {
            append(`<b>You:</b> ${m.message}`, 'right');
        } else {
            append(`<b>${m.name}: </b>${m.message}`, 'left');
        }
    });
});


// Socket events
socket.on('user-joined', name => append(`${name} joined the chat`, 'left'));
socket.on('receive', data => {
    if (data.name === username) {
        append(`<b>You: </b>${data.message}`, 'right');
    } else {
        append(`<b>${data.name}:</b> ${data.message}`, 'left');
    }
});

socket.on('left', name => append(`${name} left the chat`, 'left'));

// Login/Register form submission
let isRegister = false;

const loginBtn = document.getElementById('login-btn');
const toggleBtn = document.getElementById('toggle-btn');
const formTitle = document.getElementById('form-title');

toggleBtn.addEventListener('click', () => {
  isRegister = !isRegister;
  formTitle.textContent = isRegister ? 'Register' : 'Login';
  loginBtn.textContent = isRegister ? 'Register' : 'Login';
  toggleBtn.textContent = isRegister
    ? 'Already have an account? Login'
    : "Don't have an account? Register";
});

loginBtn.addEventListener('click', async (e) => {
  e.preventDefault();
  username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();

  if (!username || !password) {
    alert("Please fill in both fields.");
    return;
  }

  const endpoint = isRegister ? '/register' : '/login';
  const response = await fetch(`http://localhost:8000${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });

  const data = await response.json();
  alert(data.message);

  if (data.success) {
    loginOverlay.style.display = 'none';
    socket.emit('new-user-joined', username);
  }
});

// sending messages
form.addEventListener('submit', (e)=>{
    e.preventDefault();
    const message = messageInput.value;
    append(`<b>You:</b> ${message}`, 'right');
    socket.emit('send', { message, name: username });
    messageInput.value = '';
});