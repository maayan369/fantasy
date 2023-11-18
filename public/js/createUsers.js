// Temporary array to store sign-up data
const usersArray = [];
const signupForm = document.getElementById('createAccount');

// Function to handle form submission
signupForm.addEventListener('submit', async function(event) {
  event.preventDefault(); 
  // Prevent form submission to a server for this example

  // Fetch form values
  const username = document.getElementById('signupUsername').value;
  const email = document.getElementById('signupEmail').value;
  const password = document.getElementById('signupPassword').value;
  const confirmPassword = document.getElementById('signupConfirmPassword').value;

  // Validation - check if passwords match
  if (password !== confirmPassword) {
      alert("Passwords don't match. Please re-enter.");
      return;
  }

  // Generate a unique ID (for demonstration purposes)
  const userId = generateUniqueId();

  // Create an object with user data
  // const newUser = {
  //     id: userId,
  //     username: username,
  //     email: email,
  //     password: password // Note: In real applications, password hashing should be used
  // };

  // // Push the new user object to the array
  // usersArray.push(newUser);

  try {
    const response = await fetch('/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, email, password, userId }),
    });

    if (response.ok) {
      const data = await response.json();
      console.log('User data sent to server:', data);
    } else {
      throw new Error('Failed to send data to server');
    }
  } catch (error) {
    console.error('Error:', error);
  }


  // Clear form fields after sign-up
  document.getElementById('signupUsername').value = '';
  document.getElementById('signupEmail').value = '';
  document.getElementById('signupPassword').value = '';
  document.getElementById('signupConfirmPassword').value = '';

  console.log('Users Array:', usersArray);
});

// Function to generate a unique ID (for demonstration purposes)
function generateUniqueId() {
  return '_' + Math.random().toString(36).substring(2, 9);
}





