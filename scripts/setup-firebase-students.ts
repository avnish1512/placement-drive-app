/**
 * FIREBASE AUTHENTICATION SETUP
 * 
 * This script adds 5 students to Firebase Authentication
 * and creates their profiles in Firestore
 * 
 * DO ONE OF THESE:
 * 1. Run this in Firebase Cloud Functions
 * 2. Use the Firebase Console Admin SDK
 * 3. Run manually using Node.js with Firebase Admin SDK
 */

import admin from 'firebase-admin';

// Initialize Firebase Admin (use your service account key)
// Download from: Firebase Console → Project Settings → Service Accounts

const serviceAccount = require('./path-to-your-service-account-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://ignite-4d73e.firebaseio.com'
});

const auth = admin.auth();
const db = admin.firestore();

const studentsData = [
  {
    id: 'STU001',
    name: 'Priya Sharma',
    email: 'priya.sharma@student.com',
    password: 'Priya@123',
    phone: '+91 9876543210',
    course: 'Computer Science Engineering',
    year: 'Final Year',
    cgpa: 8.7,
    skills: ['React', 'JavaScript', 'TypeScript', 'Node.js'],
    resume: 'priya_resume.pdf',
    address: '123 BTech Road, University Town'
  },
  {
    id: 'STU002',
    name: 'Rahul Kumar',
    email: 'rahul.kumar@student.com',
    password: 'Rahul@123',
    phone: '+91 9876543211',
    course: 'Computer Science Engineering',
    year: 'Final Year',
    cgpa: 8.4,
    skills: ['Python', 'Machine Learning', 'Django', 'SQL'],
    resume: 'rahul_resume.pdf',
    address: '456 Engineering Avenue, Tech City'
  },
  {
    id: 'STU003',
    name: 'Aisha Patel',
    email: 'aisha.patel@student.com',
    password: 'Aisha@123',
    phone: '+91 9876543212',
    course: 'Information Technology',
    year: 'Final Year',
    cgpa: 9.1,
    skills: ['Java', 'Spring Boot', 'PostgreSQL', 'AWS'],
    resume: 'aisha_resume.pdf',
    address: '789 Campus Lane, Knowledge Park'
  },
  {
    id: 'STU004',
    name: 'Vikram Singh',
    email: 'vikram.singh@student.com',
    password: 'Vikram@123',
    phone: '+91 9876543213',
    course: 'Computer Science Engineering',
    year: 'Final Year',
    cgpa: 8.2,
    skills: ['C++', 'Data Structures', 'System Design', 'Linux'],
    resume: 'vikram_resume.pdf',
    address: '321 Scholar Street, Academic Hub'
  },
  {
    id: 'STU005',
    name: 'Neha Gupta',
    email: 'neha.gupta@student.com',
    password: 'Neha@123',
    phone: '+91 9876543214',
    course: 'Electronics and Communication',
    year: 'Final Year',
    cgpa: 8.8,
    skills: ['Embedded Systems', 'VHDL', 'IoT', 'Microcontrollers'],
    resume: 'neha_resume.pdf',
    address: '654 Innovation Way, Tech Valley'
  }
];

async function createStudentsInFirebase() {
  console.log('Starting Firebase student setup...\n');

  for (const student of studentsData) {
    try {
      // Create Firebase Auth user
      const userRecord = await auth.createUser({
        email: student.email,
        password: student.password,
        displayName: student.name,
        disabled: false,
      });

      console.log(`✅ Created auth user for ${student.name} (UID: ${userRecord.uid})`);

      // Create student profile in Firestore
      const studentProfile = {
        uid: userRecord.uid,
        id: student.id,
        name: student.name,
        email: student.email,
        phone: student.phone,
        course: student.course,
        year: student.year,
        cgpa: student.cgpa,
        skills: student.skills,
        resume: student.resume,
        address: student.address,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Save to Firestore
      await db.collection('students').doc(userRecord.uid).set(studentProfile);
      console.log(`✅ Created Firestore profile for ${student.name}\n`);

    } catch (error: any) {
      if (error.code === 'auth/email-already-exists') {
        console.log(`⚠️  Email ${student.email} already exists, updating profile...`);
        // Get existing user
        const existingUser = await auth.getUserByEmail(student.email);
        const studentProfile = {
          uid: existingUser.uid,
          id: student.id,
          name: student.name,
          email: student.email,
          phone: student.phone,
          course: student.course,
          year: student.year,
          cgpa: student.cgpa,
          skills: student.skills,
          resume: student.resume,
          address: student.address,
          updatedAt: new Date().toISOString(),
        };
        await db.collection('students').doc(existingUser.uid).set(studentProfile, { merge: true });
        console.log(`✅ Updated profile for ${student.name}\n`);
      } else {
        console.error(`❌ Error creating ${student.name}:`, error.message);
      }
    }
  }

  console.log('Firebase student setup complete!');
  process.exit(0);
}

// Run the setup
createStudentsInFirebase().catch(console.error);
