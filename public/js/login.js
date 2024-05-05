// const socket = io(); // Connects to the Socket.IO server

function generateTabId() {
  return 'txxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Function to set the current tab ID
function setCurrentTabId(tabId) {
  sessionStorage.setItem('currentTabId', tabId);
}


// Function to set the current tab ID
function setCurrentUsername(username) {
  sessionStorage.setItem('currentUsername', username);
}


function setFormMessage(formElement, type, message) {
    const messageElement = formElement.querySelector(".form__message")

    messageElement.textContent = message;
    messageElement.classList.remove("form__message--confirmed", "form__message--error");
    messageElement.classList.add(`form__message--${type}`);
};


document.addEventListener("DOMContentLoaded", () => {
  //link login and sign up forms
  const loginForm = document.querySelector("#login");
  const createAccountForm = document.querySelector("#createAccount"); 
   
  
  document.querySelector("#linkCreateAccount").addEventListener("click", e => {
      e.preventDefault();
      loginForm.classList.add("form--hidden")
      createAccountForm.classList.remove("form--hidden")
  });

  document.querySelector("#linkLogin").addEventListener("click", e => {
      e.preventDefault();
      loginForm.classList.remove("form--hidden")
      createAccountForm.classList.add("form--hidden")
  });

  // //Email confirmed note
  // if (true) {
  //   setFormMessage(loginForm, "confirmed", "המייל אומת בהצלחה!");
  // };

  //submit login
  loginForm.addEventListener("submit",  async (event) => {
    event.preventDefault();

    const loginUsername = document.getElementById('loginUsername').value;
    const loginPassword = document.getElementById('loginPassword').value;
    const timeOfLogin = Date.now(); 
    const currentTabId = generateTabId();
    setCurrentTabId(currentTabId);
    setCurrentUsername(loginUsername);


    const afterLoginLink = `http://10.80.90.227:3000/areas/thePalace.html`;


    try {
      const response = await fetch('/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ loginUsername, loginPassword, currentTabId, timeOfLogin })
      });

      if (response.ok) {

        console.log("Login successful!", currentTabId); // Log if login
        
        window.location.href = afterLoginLink;

      } else {
        const errorMessage = await response.json();
        console.error('Login failed:', errorMessage.message);
        setFormMessage(loginForm, "error", "שם משתמש או סיסמא אינם נכונים");
      }

    } catch (error) {
      console.error('Error during login:', error);
    }
  });

});


