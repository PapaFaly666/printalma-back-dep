const axios = require('axios');

const BASE_URL = 'http://localhost:3004';
const cookies = {};

async function login() {
    try {
        const response = await axios.post(`${BASE_URL}/auth/login`, {
            email: 'pf.d@zig.univ.sn',
            password: 'printalmatest123'
        });

        // Extraire le cookie des headers
        const setCookieHeader = response.headers['set-cookie'];
        if (setCookieHeader) {
            setCookieHeader.forEach(cookie => {
                const [nameValue] = cookie.split(';');
                cookies[nameValue.split('=')[0]] = nameValue.split('=')[1];
            });
        }

        console.log('✅ Login successful');
        return true;
    } catch (error) {
        console.error('❌ Login failed:', error.response?.data || error.message);
        return false;
    }
}

function getCookies() {
    return Object.entries(cookies)
        .map(([key, value]) => `${key}=${value}`)
        .join('; ');
}

async function testProfileStatus() {
    try {
        const response = await axios.get(`${BASE_URL}/auth/vendor/profile/status`, {
            headers: {
                'Cookie': getCookies()
            }
        });

        console.log('✅ Profile status:', response.data);
        return response.data;
    } catch (error) {
        console.error('❌ Profile status check failed:', error.response?.data || error.message);
        return null;
    }
}

async function testEmptyBio() {
    try {
        const response = await axios.put(`${BASE_URL}/auth/vendor/profile/bio`, {
            vendor_bio: "",
            professional_title: "Designer Test"
        }, {
            headers: {
                'Cookie': getCookies(),
                'Content-Type': 'application/json'
            }
        });

        console.log('✅ Empty bio update successful:', response.data);
        return true;
    } catch (error) {
        console.error('❌ Empty bio update failed:', error.response?.data || error.message);
        return false;
    }
}

async function testShortBio() {
    try {
        const response = await axios.put(`${BASE_URL}/auth/vendor/profile/bio`, {
            vendor_bio: "Court",
            professional_title: "Designer Test"
        }, {
            headers: {
                'Cookie': getCookies(),
                'Content-Type': 'application/json'
            }
        });

        console.log('⚠️  Short bio should fail but succeeded:', response.data);
        return false;
    } catch (error) {
        console.log('✅ Short bio correctly rejected:', error.response?.data || error.message);
        return true;
    }
}

async function testValidBio() {
    try {
        const response = await axios.put(`${BASE_URL}/auth/vendor/profile/bio`, {
            vendor_bio: "Designer graphique passionné par la création et l'innovation",
            professional_title: "Designer Graphique Senior"
        }, {
            headers: {
                'Cookie': getCookies(),
                'Content-Type': 'application/json'
            }
        });

        console.log('✅ Valid bio update successful:', response.data);
        return true;
    } catch (error) {
        console.error('❌ Valid bio update failed:', error.response?.data || error.message);
        return false;
    }
}

async function completeFirstLogin() {
    try {
        const response = await axios.post(`${BASE_URL}/auth/vendor/first-login-complete`, {}, {
            headers: {
                'Cookie': getCookies()
            }
        });

        console.log('✅ First login completed:', response.data);
        return true;
    } catch (error) {
        console.error('❌ First login completion failed:', error.response?.data || error.message);
        return false;
    }
}

async function runTests() {
    console.log('\n🚀 Starting Vendor Profile Tests...\n');

    // 1. Login
    const loginSuccess = await login();
    if (!loginSuccess) {
        console.log('⚠️  Cannot continue without login');
        return;
    }

    // 2. Check initial profile status
    console.log('\n📊 Checking initial profile status...');
    await testProfileStatus();

    // 3. Test empty bio (should work now)
    console.log('\n🧪 Testing empty bio update...');
    await testEmptyBio();

    // 4. Test short bio (should fail)
    console.log('\n🧪 Testing short bio (should fail)...');
    await testShortBio();

    // 5. Test valid bio (should work)
    console.log('\n🧪 Testing valid bio update...');
    await testValidBio();

    // 6. Complete first login
    console.log('\n✅ Completing first login...');
    await completeFirstLogin();

    // 7. Check final profile status
    console.log('\n📊 Checking final profile status...');
    await testProfileStatus();

    console.log('\n✨ Tests completed!');
}

// Run if called directly
if (require.main === module) {
    runTests();
}

module.exports = {
    login,
    testProfileStatus,
    testEmptyBio,
    testShortBio,
    testValidBio,
    completeFirstLogin,
    runTests
};