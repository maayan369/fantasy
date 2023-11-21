const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

// Construct the full path to the HTML file
const filePath = path.join(__dirname, 'confirmEmail.html');

async function main() {
  try {
    // Read the HTML file
    const confirmEmailHtml = await new Promise((resolve, reject) => {
      fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      });
    });

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
      from: 'Fantasyland Admin <fantasyland.adm@gmail.com>',
      to: 'ymaayan2003@gmail.com',
      subject: 'Testing, testing, 123',
      html: confirmEmailHtml,
    });

    console.log('message sent:', info.messageId);
  } catch (error) {
    console.error('Error:', error);
  }
}

module.exports = {
  main,
};