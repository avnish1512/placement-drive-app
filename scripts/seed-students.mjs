/**
 * seed-students.mjs
 * Creates all 5 pre-defined student accounts in Firebase Auth + Firestore.
 * Run with: node scripts/seed-students.mjs
 *
 * Credentials from LOGIN_CREDENTIALS.md:
 *   Student 1: priya.sharma@student.com   / Priya@123
 *   Student 2: rahul.kumar@student.com    / Rahul@123
 *   Student 3: aisha.patel@student.com    / Aisha@123
 *   Student 4: vikram.singh@student.com   / Vikram@123
 *   Student 5: neha.gupta@student.com     / Neha@123
 */

import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithEmailAndPassword
} from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAC0TYsSETT0RN36ItoyRdujhpZm_HikDA",
  authDomain: "ignite-4d73e.firebaseapp.com",
  projectId: "ignite-4d73e",
  storageBucket: "ignite-4d73e.firebasestorage.app",
  messagingSenderId: "61424015105",
  appId: "1:61424015105:web:f132b36df294522d3b6d00",
};

const app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// All 5 pre-defined students from LOGIN_CREDENTIALS.md
const STUDENTS = [
  {
    name: 'Priya Sharma',
    email: 'priya.sharma@student.com',
    password: 'Priya@123',
    studentId: 'STU001',
    course: 'Computer Science Engineering',
    year: 'Final Year',
    cgpa: 8.7,
    phone: '+91 9876543210',
  },
  {
    name: 'Rahul Kumar',
    email: 'rahul.kumar@student.com',
    password: 'Rahul@123',
    studentId: 'STU002',
    course: 'Computer Science Engineering',
    year: 'Final Year',
    cgpa: 8.4,
    phone: '+91 9876543211',
  },
  {
    name: 'Aisha Patel',
    email: 'aisha.patel@student.com',
    password: 'Aisha@123',
    studentId: 'STU003',
    course: 'Information Technology',
    year: 'Final Year',
    cgpa: 9.1,
    phone: '+91 9876543212',
  },
  {
    name: 'Vikram Singh',
    email: 'vikram.singh@student.com',
    password: 'Vikram@123',
    studentId: 'STU004',
    course: 'Computer Science Engineering',
    year: 'Final Year',
    cgpa: 8.2,
    phone: '+91 9876543213',
  },
  {
    name: 'Neha Gupta',
    email: 'neha.gupta@student.com',
    password: 'Neha@123',
    studentId: 'STU005',
    course: 'Electronics and Communication',
    year: 'Final Year',
    cgpa: 8.8,
    phone: '+91 9876543214',
  },
];

async function seedStudent(student) {
  const { name, email, password, studentId, course, year, cgpa, phone } = student;

  let uid;

  // Try to create the Firebase Auth account
  try {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    uid = credential.user.uid;
    await updateProfile(credential.user, { displayName: name });
    console.log(`  ✅ Auth created for ${name} (${email})`);
  } catch (error) {
    if (error.code === 'auth/email-already-in-use') {
      // Account already exists — sign in to get the UID
      try {
        const credential = await signInWithEmailAndPassword(auth, email, password);
        uid = credential.user.uid;
        console.log(`  ℹ️  Auth already exists for ${name} — using existing account`);
      } catch (loginErr) {
        console.error(`  ❌ Could not sign in as ${email}: ${loginErr.message}`);
        return;
      }
    } else {
      console.error(`  ❌ Could not create ${email}: ${error.message}`);
      return;
    }
  }

  // Write/update Firestore student document
  const studentDoc = {
    id: uid,
    studentId,
    name,
    email,
    phone,
    course,
    year,
    cgpa,
    skills: [],
    resume: '',
    address: '',
    profileCompleted: true,   // Pre-seeded students already have their profile
    isActive: true,
    createdAt: new Date().toISOString(),
  };

  await setDoc(doc(db, 'students', uid), studentDoc, { merge: true });
  console.log(`  📄 Firestore doc saved for ${name}`);
}

async function main() {
  console.log('\n🌱 Seeding student accounts into Firebase...\n');
  console.log(`   Project: ignite-4d73e`);
  console.log(`   Students: ${STUDENTS.length}\n`);

  for (const student of STUDENTS) {
    console.log(`→ Processing: ${student.name} (${student.email})`);
    await seedStudent(student);
    console.log('');
  }

  console.log('✅ Seeding complete!\n');
  console.log('All students can now login with their credentials from LOGIN_CREDENTIALS.md');
  console.log('Since profileCompleted = true, they will go directly to the dashboard.\n');
  process.exit(0);
}

main().catch(err => {
  console.error('\n❌ Fatal error:', err.message);
  process.exit(1);
});
