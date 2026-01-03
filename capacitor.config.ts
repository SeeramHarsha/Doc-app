import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'com.doctor.booking.admin',
    appName: 'Dr. Portal',
    webDir: 'public',
    server: {
        url: 'http://192.168.1.34:3000',
        cleartext: true
    }
};

export default config;
