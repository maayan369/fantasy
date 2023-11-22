function setFormMessage(formElement, type, message) {
    const messageElement = formElement.querySelector(".form__message")

    messageElement.textContent = message;
    messageElement.classList.remove("form__message--success", "form__message--error");
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

    //submit login
    loginForm.addEventListener("submit",  async function(event) {
        event.preventDefault();

        const loginUsername = document.getElementById('loginUsername').value;
        const loginPassword = document.getElementById('loginPassword').value;
        
        try {
            const response = await fetch('/login', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ loginUsername, loginPassword })
            });
    
            if (response.ok) {
              // Redirect to a dashboard or perform other actions for successful login
              console.log('Login successful');
              window.location.href = "http://localhost:3000/areas/thePalace.html";
              //יהיה צריך להוסיף שזה יהיה לפי משתמש ואם הוא לא מחובר אז זה לא יעבוד..
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





