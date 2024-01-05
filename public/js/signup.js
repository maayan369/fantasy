
const signupForm = document.getElementById('createAccount');
const signupUsernameInput = document.getElementById("signupUsername");
const signupEmailInput = document.getElementById("signupEmail");
const signupPasswordInput = document.getElementById("signupPassword");
const signupConfirmPasswordInput = document.getElementById("signupConfirmPassword");

let sendForm = true;
let usernameExistanceValid = false;


function setInputError(inputElement, message) {
  inputElement.classList.add("form__input--error");
  inputElement.parentElement.querySelector(".form__input--error-message").textContent = message;
};

function clearInputError(inputElement) {
  inputElement.classList.remove("form__input--error");
  inputElement.parentElement.querySelector(".form__input--error-message").textContent = "";
};

function isFormValid() {
  if (
    usernameExistanceValid &&
    signupConfirmPasswordInput.value === signupPasswordInput.value
  ) {
    sendForm = true;
  }
};


//Set if the form can be sent
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".form__input").forEach(inputElement => {

    //username sign up error check
    signupUsernameInput.addEventListener("blur", async (e) => {
      const username = signupUsernameInput.value;
      if(username){
        try {
          const response = await fetch(`/check-username/${username}`);
          const data = await response.json();
      
          if (data.exists) {
            setInputError(signupUsernameInput, 'שם משתמש תפוס');
            sendForm = false;
            usernameExistanceValid = false;
  
          } else {
            clearInputError(signupUsernameInput);
            usernameExistanceValid = true;
            isFormValid();
          }
        } catch (error) {
          console.error('Error:', error);
        };
      }
    });

    signupUsernameInput.addEventListener("input", async () => {
      const username = signupUsernameInput.value;
      if(username){
        try {
          const response = await fetch(`/check-username/${username}`);
          const data = await response.json();
      
          if (!data.exists) {
            usernameExistanceValid = true;
            clearInputError(signupUsernameInput);
            isFormValid();
          }
        } catch (error) {
          console.error('Error:', error);
        };
      }   
    });

    //confirm password sign up error check
    signupConfirmPasswordInput.addEventListener("blur", e => {
      if (signupConfirmPasswordInput.value !== signupPasswordInput.value) {
        setInputError(signupConfirmPasswordInput, "הסיסמא לא אותה סיסמא");
        sendForm = false;
      } else {
        clearInputError(signupConfirmPasswordInput);
        isFormValid();
      }
    });
    signupConfirmPasswordInput.addEventListener("input", () => {
      if (signupConfirmPasswordInput.value === signupPasswordInput.value) {
        clearInputError(signupConfirmPasswordInput);
        isFormValid();
      }
    });
    signupPasswordInput.addEventListener("input", () => {
      if (signupPasswordInput.value === signupConfirmPasswordInput.value) {
        clearInputError(signupConfirmPasswordInput);
        isFormValid();
      }
    });

  });
});


//make an id
function generateUniqueId() {
  const timestamp = Date.now().toString(36); // Convert current timestamp to base 36 string
  const randomString = Math.random().toString(36).substring(2, 10); // Generate a random string
  const uniqueId = timestamp + randomString; // Concatenate timestamp and random string
  return uniqueId;
};

function generateUniqueToken() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Function to handle form submission
signupForm.addEventListener('submit', async function(event) {
  event.preventDefault(); 
  // Prevent form submission to a server for this example

  // Set if the form can be sent
  if (sendForm !== true) {
      alert("לא ניתן לשלוח את הטופס עד שכל השדות נכונים");
      return;
  };

  const username = document.getElementById('signupUsername').value;
  const email = document.getElementById('signupEmail').value;
  const password = document.getElementById('signupPassword').value;
  const id = generateUniqueId();
  const confirmationToken = generateUniqueToken();
  const confirmationLink = `http://localhost:3000/confirmation/confirm-email/${confirmationToken}`;

  try {
    const response = await fetch('/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, email, password, id, confirmationToken, confirmationLink }),
    });

    if (response.ok) {
      // const data = await response.json();
      console.log('User data sent to server');
    } else {
      throw new Error('Failed to send data to server');
    }
  } catch (error) {
    console.error('Error:', error);
  };
  
  // Clear form fields after sign-up
  document.getElementById('signupUsername').value = '';
  document.getElementById('signupEmail').value = '';
  document.getElementById('signupPassword').value = '';
  document.getElementById('signupConfirmPassword').value = '';
});
