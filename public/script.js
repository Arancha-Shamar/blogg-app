const API_URL = 'http://localhost:5000/api';


document.getElementById('darkModeToggle')?.addEventListener('click', () => {
  document.body.classList.toggle('dark-mode');
});


const getToken = () => localStorage.getItem('token');
const getRole = () => localStorage.getItem('role');
const getUsername = () => localStorage.getItem('username');


function updateUserInfo() {
  const username = getUsername();
  const userInfo = document.getElementById('userInfo');
  const logoutButton = document.getElementById('logoutButton');

  if (username) {
    userInfo.innerText = `Welcome, ${username}`;
    logoutButton.style.display = 'inline-block';
  } else {
    userInfo.innerText = 'Not logged in';
    logoutButton.style.display = 'none';
  }
}


async function register() {
  const username = document.getElementById('registerUsername').value;
  const password = document.getElementById('registerPassword').value;

  const response = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  alert((await response.json()).message);
  window.location.href = 'login.html';
}


async function login() {
  const username = document.getElementById('loginUsername').value;
  const password = document.getElementById('loginPassword').value;

  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  const data = await response.json();
  if (response.ok) {
    localStorage.setItem('token', data.token);
    localStorage.setItem('username', data.username);
    localStorage.setItem('role', data.role);
    window.location.href = 'index.html';
  } else {
    alert(data.message);
  }
}


function logout() {
  localStorage.clear();
  window.location.href = 'login.html';
}


async function createPost() {
  const title = document.getElementById('postTitle').value;
  const content = document.getElementById('postContent').value;

  if (!title || !content) {
    alert('Title and content are required');
    return;
  }

  await fetch(`${API_URL}/posts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify({ title, content }),
  });

  alert('Post created!');
  fetchPosts();
}


async function fetchPosts() {
  const response = await fetch(`${API_URL}/posts`);
  const posts = await response.json();
  const postList = document.getElementById('postList');

  postList.innerHTML = posts.map(post => `
    <div class="post">
      <h3>${post.title}</h3>
      <p>${post.content}</p>
      <p><em>Author: ${post.author}</em></p>

      <!-- Show Edit button if user is the author -->
      ${post.author === getUsername() ? `
        <button onclick="editPost(${post.id}, '${post.title}', '${post.content}')">Edit</button>
      ` : ''}

      <!-- Show Delete button if user is the author or admin -->
      ${(post.author === getUsername() || getRole() === 'admin') ? `
        <button onclick="deletePost(${post.id})">Delete</button>
      ` : ''}
    </div>
  `).join('');
}


async function editPost(id, title, content) {
  const newTitle = prompt('Edit Title:', title);
  const newContent = prompt('Edit Content:', content);

  if (!newTitle || !newContent) {
    alert('Title and content are required');
    return;
  }

  await fetch(`${API_URL}/posts/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify({ title: newTitle, content: newContent }),
  });

  alert('Post updated!');
  fetchPosts();
}


async function deletePost(id) {
  if (!confirm('Are you sure you want to delete this post?')) return;

  await fetch(`${API_URL}/posts/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${getToken()}` },
  });

  alert('Post deleted!');
  fetchPosts();
}


function init() {
  updateUserInfo();
  if (document.getElementById('postList')) {
    fetchPosts();
  }
}

window.onload = init;
