const signupForm = document.getElementById('createAccount');
let sendForm = true;


function setInputError(inputElement, message) {
  inputElement.classList.add("form__input--error");
  inputElement.parentElement.querySelector(".form__input--error-message").textContent = message;
};

function clearInputError(inputElement) {
  inputElement.classList.remove("form__input--error");
  inputElement.parentElement.querySelector(".form__input--error-message").textContent = "";
};


//Set if the form can be sent
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".form__input").forEach(inputElement => {

    const signupUsernameInput = document.getElementById("signupUsername");

    signupUsernameInput.addEventListener("blur", e => {
      if (signupUsernameInput.value.length > 0 && signupUsernameInput.value.length < 6) {
        setInputError(signupUsernameInput, "שם משתמש חייב להכיל לפחות 6 תווים");
        sendForm = false;
      } else {
        clearInputError(signupUsernameInput);
        sendForm = true;
      }
    });
  
    signupUsernameInput.addEventListener("input", () => {
      if (signupUsernameInput.value.length === 0 || signupUsernameInput.value.length >= 6) {
        clearInputError(signupUsernameInput);
        sendForm = true;
      }
    });

  });
});





// Function to handle form submission
signupForm.addEventListener('submit', async function(event) {
  event.preventDefault(); 
  // Prevent form submission to a server for this example

  // Set if the form can be sent
  if (sendForm !== true) {
      alert("לא ניתן לשלוח את הטופס עד שכל השדות נכונים");
      return;
  };

    // Fetch form values
    const username = document.getElementById('signupUsername').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('signupConfirmPassword').value;

  try {
    const response = await fetch('/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, email, password }),
    });

    if (response.ok) {
      const data = await response.json();
      console.log('User data sent to server:', data);
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
