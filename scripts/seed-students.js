/**
 * MANUAL SETUP SCRIPT FOR STUDENTS
 * 
 * This script adds 5 test students to your Firebase database.
 * Run this ONCE using Firebase Console or a Node.js environment
 * 
 * Steps:
 * 1. Go to https://console.firebase.google.com/
 * 2. Select your "ignite-4d73e" project
 * 3. Go to Firestore Database
 * 4. Create a collection called "students"
 * 5. Add these documents manually OR use the code below
 */

// STUDENT DATA - ADD THESE TO FIRESTORE MANUALLY

const students = [
  {
    id: "STU001",
    name: "Priya Sharma",
    email: "priya.sharma@student.com",
    password: "Priya@123", // HASH THIS in production - currently for demo only
    phone: "+91 9876543210",
    course: "Computer Science Engineering",
    year: "Final Year",
    cgpa: 8.7,
    skills: ["React", "JavaScript", "TypeScript", "Node.js"],
    resume: "priya_resume.pdf",
    address: "123 BTech Road, University Town",
    createdAt: new Date().toISOString(),
  },
  {
    id: "STU002",
    name: "Rahul Kumar",
    email: "rahul.kumar@student.com",
    password: "Rahul@123",
    phone: "+91 9876543211",
    course: "Computer Science Engineering",
    year: "Final Year",
    cgpa: 8.4,
    skills: ["Python", "Machine Learning", "Django", "SQL"],
    resume: "rahul_resume.pdf",
    address: "456 Engineering Avenue, Tech City",
    createdAt: new Date().toISOString(),
  },
  {
    id: "STU003",
    name: "Aisha Patel",
    email: "aisha.patel@student.com",
    password: "Aisha@123",
    phone: "+91 9876543212",
    course: "Information Technology",
    year: "Final Year",
    cgpa: 9.1,
    skills: ["Java", "Spring Boot", "PostgreSQL", "AWS"],
    resume: "aisha_resume.pdf",
    address: "789 Campus Lane, Knowledge Park",
    createdAt: new Date().toISOString(),
  },
  {
    id: "STU004",
    name: "Vikram Singh",
    email: "vikram.singh@student.com",
    password: "Vikram@123",
    phone: "+91 9876543213",
    course: "Computer Science Engineering",
    year: "Final Year",
    cgpa: 8.2,
    skills: ["C++", "Data Structures", "System Design", "Linux"],
    resume: "vikram_resume.pdf",
    address: "321 Scholar Street, Academic Hub",
    createdAt: new Date().toISOString(),
  },
  {
    id: "STU005",
    name: "Neha Gupta",
    email: "neha.gupta@student.com",
    password: "Neha@123",
    phone: "+91 9876543214",
    course: "Electronics and Communication",
    year: "Final Year",
    cgpa: 8.8,
    skills: ["Embedded Systems", "VHDL", "IoT", "Microcontrollers"],
    resume: "neha_resume.pdf",
    address: "654 Innovation Way, Tech Valley",
    createdAt: new Date().toISOString(),
  }
];

// FIREBASE CONSOLE SETUP INSTRUCTIONS:
/*
MANUAL STEPS TO ADD STUDENTS:

1. Open Firebase Console: https://console.firebase.google.com/
2. Select your project "ignite-4d73e" → Firestore Database
3. Create a new collection: "students"
4. Click "Add Document" and for each student below, add:

STUDENT 1:
- Document ID: STU001
- Fields: (Copy all fields from STU001 object)

STUDENT 2:
- Document ID: STU002
- Fields: (Copy all fields from STU002 object)

STUDENT 3:
- Document ID: STU003
- Fields: (Copy all fields from STU003 object)

STUDENT 4:
- Document ID: STU004
- Fields: (Copy all fields from STU004 object)

STUDENT 5:
- Document ID: STU005
- Fields: (Copy all fields from STU005 object)

AFTER CREATING STUDENTS IN FIRESTORE:
- Update /hooks/auth-store.ts with new login credentials
- Users can now login with their email and password
*/

console.log("Student Data for Firebase:");
console.log("===========================\n");
students.forEach((student, index) => {
  console.log(`\nSTUDENT ${index + 1}:`);
  console.log(`  ID: ${student.id}`);
  console.log(`  Name: ${student.name}`);
  console.log(`  Email: ${student.email}`);
  console.log(`  Password: ${student.password}`);
  console.log(`  Course: ${student.course}`);
  console.log(`  Year: ${student.year}`);
  console.log(`  CGPA: ${student.cgpa}`);
  console.log(`  Phone: ${student.phone}`);
});

module.exports = students;
