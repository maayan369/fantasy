const signingUp = (req,res) => {
    res.status(201).json("signup successfully!")
}

const sendmail = (req,res) => {
    res.status(201).json("email sent successfully!")
}


module.exports = {
    signingUp,
    sendmail
}