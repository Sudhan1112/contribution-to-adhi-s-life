// In a real application, you would use a proper email service like SendGrid or NodeMailer
// This is a mock implementation for demonstration purposes

const sendActivationEmail = async (email, activationLink) => {
    console.log(`
        Sending activation email to: ${email}
        Activation link: ${activationLink}
        
        Dear User,
        
        Thank you for registering. Please click the following link to activate your account:
        ${activationLink}
        
        Best regards,
        User Management API Team
    `);
    return Promise.resolve();
};

const sendPasswordResetEmail = async (email, resetLink) => {
    console.log(`
        Sending password reset email to: ${email}
        Reset link: ${resetLink}
        
        Dear User,
        
        You have requested to reset your password. Please click the following link to set a new password:
        ${resetLink}
        
        If you did not request this reset, please ignore this email.
        
        Best regards,
        User Management API Team
    `);
    return Promise.resolve();
};

module.exports = {
    sendActivationEmail,
    sendPasswordResetEmail
};