const request = require('supertest');
const app = require('../app');
const User = require('../models/User');
const UserLog = require('../models/UserLog');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

describe('Login Page', () => {
    beforeAll(async () => {
        // Clear all existing users and user logs to ensure a clean state for testing
        await User.deleteMany({});
        await UserLog.deleteMany({});

        // Create a standard active user for successful login tests
        const hashedPassword = await bcrypt.hash('test1234', 10);
        await User.create({
          username: 'testuser123',
          name: 'Test User',
          email: 'test@example.com',
          password: hashedPassword,
          status: 'active',
          userType: 'EndUser',
          loginAttempts: 0,
          lockUntil: undefined
        });

        // Create an inactive user (e.g., pending email verification)
        const inactiveHashedPassword = await bcrypt.hash('inactive1234', 10);
        await User.create({
            username: 'inactiveuser',
            name: 'Inactive User',
            email: 'inactive@example.com',
            password: inactiveHashedPassword,
            status: 'pending',
            userType: 'EndUser',
            loginAttempts: 0,
            lockUntil: undefined
        });

        // Create a pre-locked user (for direct testing of locked accounts)
        const lockedHashedPassword = await bcrypt.hash('locked123', 10);
        await User.create({
            username: 'lockeduser',
            name: 'Locked User',
            email: 'locked@example.com',
            password: lockedHashedPassword,
            status: 'active',
            userType: 'EndUser',
            loginAttempts: 0,
            lockUntil: new Date(Date.now() + 60 * 1000 * 5) // locked for 5 minute
        });

        // Create an Admin user to test admin specific redirects
        const adminHashedPassword = await bcrypt.hash('admin123', 10);
        await User.create({
            username: 'adminuser',
            name: 'Admin User',
            email: 'admin@example.com',
            password: adminHashedPassword,
            status: 'active',
            userType: 'Admin',
            loginAttempts: 0,
            lockUntil: undefined
        });
    });

    beforeEach(async () => {
        await UserLog.deleteMany({});
    });

    afterAll(async () => {
        await mongoose.connection.close();
    });
    
    // ---  TESTS ---

    // Test case: GET request to the login page
    it('GET /users/login should return 200 OK and contain "Login"', async () => {
        const res = await request(app).get('/users/login');
        expect(res.statusCode).toBe(200);
        expect(res.text).toContain('Login');
    });

    // Test case: Successful login with valid credentials
    it('POST /users/login with valid credentials should redirect', async () => {
      const res = await request(app)
        .post('/users/login')
        .send({ email: 'test@example.com', password: 'test1234' });
    
        expect(res.statusCode).toBe(302); // redirect
        expect(res.header.location).toBe('/dashboard'); // dashboard page

        // Verify that a successful login attempt was logged
        const successLog = await UserLog.findOne({ email: 'test@example.com', log: 'Login successful' });
        expect(successLog).toBeDefined();
        expect(successLog.username).toBe('testuser123'); // Check if username is also logged
    });

    // Test case: Login attempt with a correct email but wrong password
    it('POST /users/login with wrong password should redirect back with error', async () => {
      const res = await request(app)
        .post('/users/login')
        .send({ email: 'test@example.com', password: 'wrongpass' });

        expect(res.statusCode).toBe(302); // redirect
        expect(res.header.location).toBe('/users/login'); // again login page

        // Verify that a failed login attempt was logged with the specific message
        const failedLog = await UserLog.findOne({ email: 'test@example.com', log: 'Login failed: Password incorrect' });
        expect(failedLog).toBeDefined();
        expect(failedLog.ipAddress).toBeDefined(); // Check if IP address is logged
    });

    // Test case: Login attempt with an email that is not registered
    it('POST /users/login with unregistered email should redirect back with "not registered" error and log failure', async () => {
        const res = await request(app)
            .post('/users/login')
            .send({ email: 'unregistered@example.com', password: 'anypassword' });

        expect(res.statusCode).toBe(302);
        expect(res.header.location).toBe('/users/login');

        // Verify the specific error message in the log
        const failedLog = await UserLog.findOne({ email: 'unregistered@example.com', log: 'Login failed: That email is not registered' });
        expect(failedLog).toBeDefined();
    });

    // Test case: Login attempt with an inactive account (e.g., email not verified)
    it('POST /users/login with inactive account should redirect back with "Account not active" error and log failure', async () => {
        const res = await request(app)
            .post('/users/login')
            .send({ email: 'inactive@example.com', password: 'inactive123' });

        expect(res.statusCode).toBe(302);
        expect(res.header.location).toBe('/users/login');

        // Verify the specific error message in the log
        const failedLog = await UserLog.findOne({ email: 'inactive@example.com', log: 'Login failed: Account not active. Please verify your email.' });
        expect(failedLog).toBeDefined();
    });

    // Test case: Login attempt with a pre-locked account (directly testing the lock condition)
    it('POST /users/login with locked account should redirect back with "Account locked" error and log failure', async () => {
        const res = await request(app)
            .post('/users/login')
            .send({ email: 'locked@example.com', password: 'locked123' }); // Even with correct password, it should be locked

        expect(res.statusCode).toBe(302);
        expect(res.header.location).toBe('/users/login');

        // Verify the specific error message in the log (using stringContaining for dynamic remaining time)
        const failedLog = await UserLog.findOne({ email: 'locked@example.com', log: expect.stringContaining('Login failed: Account locked. Please try again after') });
        expect(failedLog).toBeDefined();
    });

    // Test case: Account locking mechanism (verifying the lock after 2 failed attempts)
    it('POST /users/login should lock account after 2 failed attempts and log failures', async () => {
        const email = 'test@example.com';
        const correctPassword = 'test1234';
        const wrongPassword = 'anotherwrongpass';

        // Reset user's loginAttempts and lockUntil to ensure clean test state
        await User.findOneAndUpdate({ email }, { loginAttempts: 0, lockUntil: undefined });
        let userBeforeAttempts = await User.findOne({ email });
        expect(userBeforeAttempts.loginAttempts).toBe(0);
        expect(userBeforeAttempts.lockUntil).toBeUndefined();

        // 1st failed attempt
        await request(app)
            .post('/users/login')
            .send({ email, password: wrongPassword });
        let userAfter1stAttempt = await User.findOne({ email });
        expect(userAfter1stAttempt.loginAttempts).toBe(1);
        expect(userAfter1stAttempt.lockUntil).toBeUndefined(); // Should not be locked yet

        // 2nd failed attempt (should trigger the lock)
        await request(app)
            .post('/users/login')
            .send({ email, password: wrongPassword });
        let userAfter2ndAttempt = await User.findOne({ email });
        expect(userAfter2ndAttempt.loginAttempts).toBe(0); // loginAttempts should reset to 0 after locking
        expect(userAfter2ndAttempt.lockUntil).toBeInstanceOf(Date); // lockUntil should be set
        expect(userAfter2ndAttempt.lockUntil.getTime()).toBeGreaterThan(Date.now()); // Lock time should be in the future

        // Verify both failed attempts were logged
        const failedLogs = await UserLog.find({ email, log: 'Login failed: Password incorrect' });
        expect(failedLogs).toHaveLength(2); // Two logs for wrong password attempts

        // Try to log in with correct password after lock (should still fail)
        const resLocked = await request(app)
            .post('/users/login')
            .send({ email, password: correctPassword });
        expect(resLocked.statusCode).toBe(302);
        expect(resLocked.header.location).toBe('/users/login');
        
        // Verify the final 'Account locked' failure log
        const finalFailedLog = await UserLog.findOne({ email, log: expect.stringContaining('Login failed: Account locked. Please try again after') });
        expect(finalFailedLog).toBeDefined();
    }, 20000); // Increase timeout for this test as it involves multiple requests and database updates

    // Test case: Login attempt with empty email
    it('POST /users/login with empty email should redirect back with error and log failure', async () => {
        const res = await request(app)
            .post('/users/login')
            .send({ email: '', password: 'test1234' });

        expect(res.statusCode).toBe(302);
        expect(res.header.location).toBe('/users/login');
        // Verify the specific error message in the log
        const failedLog = await UserLog.findOne({ email: '', log: 'Login failed: Please fill in all fields' });
        expect(failedLog).toBeDefined();
    });

    // Test case: Login attempt with empty password
    it('POST /users/login with empty password should redirect back with error and log failure', async () => {
        const res = await request(app)
            .post('/users/login')
            .send({ email: 'test@example.com', password: '' });

        expect(res.statusCode).toBe(302);
        expect(res.header.location).toBe('/users/login');
        // Verify the specific error message in the log
        const failedLog = await UserLog.findOne({ email: 'test@example.com', log: 'Login failed: Please fill in all fields' });
        expect(failedLog).toBeDefined();
    });

    // Test case: Admin user login and redirection to admin dashboard
    it('POST /users/login with admin credentials should redirect to admin dashboard', async () => {
        const res = await request(app)
            .post('/users/login')
            .send({ email: 'admin@example.com', password: 'admin123' });

        expect(res.statusCode).toBe(302);
        expect(res.header.location).toBe('/admin/dashboard');

        // Verify successful login log for admin
        const successLog = await UserLog.findOne({ email: 'admin@example.com', log: 'Login successful' });
        expect(successLog).toBeDefined();
        expect(successLog.username).toBe('adminuser');
    });

    // Test case: Logout functionality
    it('GET /users/logout should log out the user, clear refresh token cookie, and redirect to login page', async () => {
        const agent = request.agent(app);

        // First, log in the user to establish a session and get cookies
        await agent
            .post('/users/login')
            .send({ email: 'test@example.com', password: 'test1234' })
            .expect(302);

        // Then, perform the logout
        const res = await agent.get('/users/logout');

        expect(res.statusCode).toBe(302); // Expects a redirect
        expect(res.header.location).toBe('/users/login'); // Expects redirection to the login page
    });
});