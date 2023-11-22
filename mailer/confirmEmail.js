const nodemailer = require('nodemailer');

// Construct the full path to the HTML file
// const html = path.join(__dirname, 'confirmEmail.html');

async function sendConfirmEmail(username, email, password, confirmationLink) {
  
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: 'fantasyland.adm@gmail.com',
        pass: 'gsil ccgz shiq bkwu',
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    
    const info = await transporter.sendMail({
      from: 'Fantasyland <fantasyland.adm@gmail.com>',
      to: email,
      subject: 'אימות כתובת מייל',
      html: `
      <div dir="rtl" style="text-align: right;">
      <h1>שלום ${username}</h1>
      <p>אנחנו שמחים שהצטרפת לפנטזיה!</p>
      <br>
      <p>פרטי ההתחברות שלך:</p>
      <p>שם משתמש: ${username}</p>
      <p>סיסמא: ${password}</p>
      <p>מומלץ שלא לשתף את פרטי ההתחברות עם אדם אחר</p>
      <br>
      <p>כדי להתחיל לשחק עליך לאמת את כתובת המייל</p>
      <a href="${confirmationLink}">
        <button type="button">אימות כתובת מייל</button>
      </a>
      <p>בברכה ומשחק נעים, צוות פנטזיה</p>
      </div>
      `,
    });

    console.log('Confirmation email sent:', info.messageId);
  
}

module.exports = {
    sendConfirmEmail,
};