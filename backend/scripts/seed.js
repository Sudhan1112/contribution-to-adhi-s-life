require('dotenv').config();
const connectDB = require('../config/db');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

const users = [
    {
        email: 'admin@test.com',
        password: 'admin123',
        name: 'Admin User',
        role: 'admin',
        isActive: true
    },
    {
        email: 'user@test.com',
        password: 'user123',
        name: 'Regular User',
        role: 'user',
        isActive: true
    }
];

const seedDatabase = async () => {
    try {
        await connectDB();
        
        // Clear existing users
        await User.deleteMany({});
        console.log('Deleted existing users');

        // Create new users
        for (const user of users) {
            const hashedPassword = await bcrypt.hash(user.password, 12);
            await User.create({
                ...user,
                password: hashedPassword
            });
        }

        console.log('Database seeded successfully');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    }
};

seedDatabase();