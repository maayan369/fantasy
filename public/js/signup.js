const signupForm = document.getElementById('createAccount');
const signupUsernameInput = document.getElementById("signupUsername");
const signupEmailInput = document.getElementById("signupEmail");
const signupPasswordInput = document.getElementById("signupPassword");
const signupConfirmPasswordInput = document.getElementById("signupConfirmPassword");

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
    //username sign up error check
    signupUsernameInput.addEventListener("blur", e => {
      if (signupUsernameInput.value.length > 0 && signupUsernameInput.value.length < 6) {
        setInputError(signupUsernameInput, "שם משתמש חייב להכיל לפחות 6 תווים");
        sendForm = false;
      } else {
        clearInputError(signupUsernameInput);
        isFormValid();
      }
    });
    signupUsernameInput.addEventListener("input", () => {
      if (signupUsernameInput.value.length === 0 || signupUsernameInput.value.length >= 6) {
        clearInputError(signupUsernameInput);
        isFormValid();
      }
    });

    // //email sign up error check--later(now i have automatic email type input)
    // signupEmailInput.addEventListener("blur", e => {
    //   if (signupEmailInput.value.length > 0 && signupUsernameInput) {
    //     setInputError(signupEmailInput, "יש להכניס כתובת אימייל תקינה");
    //     sendForm = false;
    //   } else {
    //     clearInputError(signupEmailInput);
    //     isFormValid();
    //   }
    // });
    // signupEmailInput.addEventListener("input", () => {
    //   if (signupEmailInput.value.length === 0) {
    //     clearInputError(signupEmailInput);
    //     isFormValid();
    //   }
    // });

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

function isFormValid() {
  if (
    signupUsernameInput.value.length === 0 || signupUsernameInput.value.length >= 6 &&
    signupConfirmPasswordInput.value === signupPasswordInput.value
  ) {
    sendForm = true;
  }
};

//make an id
function generateUniqueId() {
  const timestamp = Date.now().toString(36); // Convert current timestamp to base 36 string
  const randomString = Math.random().toString(36).substring(2, 10); // Generate a random string

  const uniqueId = timestamp + randomString; // Concatenate timestamp and random string
  return uniqueId;
};


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
  try {
    const response = await fetch('/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, email, password, id }),
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
