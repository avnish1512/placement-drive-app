import { Job } from '@/types/job';

export const mockJobs: Job[] = [
  {
    id: '1',
    title: 'Associate Software Engineer',
    company: 'rtCamp Solutions Private Limited',
    companyLogo: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=100&h=100&fit=crop&crop=center',
    location: 'PAN India',
    ctc: { min: 900000, max: 1200000 },
    jobType: 'Internship + Full-Time',
    industry: 'IT / Computers - Software',
    requirements: [
      'Bachelor\'s degree in Computer Science or related field',
      'Strong programming skills in JavaScript, PHP, MySQL',
      'Understanding of web development concepts',
      'Good communication skills'
    ],
    description: 'We are looking for passionate software engineers to join our growing team. You will work on exciting projects and learn from experienced developers.',
    skills: ['Javascript', 'MySQL', 'PHP'],
    eligibilityStatus: 'Eligible',
    registrationDeadline: '2025-08-20T12:00:00Z',
    postedDate: '2025-08-24T10:00:00Z',
    isActive: true
  },
  {
    id: '2',
    title: 'Graduate Engineer Trainee',
    company: 'Faurecia India Private Limited',
    companyLogo: 'https://images.unsplash.com/photo-1549923746-c502d488b3ea?w=100&h=100&fit=crop&crop=center',
    location: 'Pune, Maharashtra, India',
    ctc: { min: 550000, max: 550000 },
    jobType: 'Internship + Full-Time',
    industry: 'Automotive',
    requirements: [
      'Bachelor\'s degree in Mechanical/Electrical Engineering',
      'Strong analytical and problem-solving skills',
      'Knowledge of automotive systems',
      'Willingness to learn and adapt'
    ],
    description: 'Join our graduate trainee program and kickstart your career in the automotive industry with hands-on experience.',
    skills: ['Mechanical Engineering', 'Problem Solving', 'Automotive'],
    eligibilityStatus: 'Eligible',
    registrationDeadline: '2025-07-11T12:00:00Z',
    postedDate: '2025-07-30T10:00:00Z',
    isActive: true
  },
  {
    id: '3',
    title: 'Frontend Developer Intern',
    company: 'TechCorp Solutions',
    companyLogo: 'https://images.unsplash.com/photo-1572021335469-31706a17aaef?w=100&h=100&fit=crop&crop=center',
    location: 'Bangalore, India',
    ctc: { min: 400000, max: 600000 },
    jobType: 'Internship',
    industry: 'IT / Computers - Software',
    requirements: [
      'Knowledge of React, JavaScript, HTML, CSS',
      'Understanding of responsive design',
      'Good problem-solving skills',
      'Portfolio of projects'
    ],
    description: 'Work with our frontend team to build amazing user interfaces and gain real-world experience.',
    skills: ['React', 'JavaScript', 'HTML', 'CSS'],
    eligibilityStatus: 'Applied',
    registrationDeadline: '2025-09-15T12:00:00Z',
    postedDate: '2025-08-25T10:00:00Z',
    isActive: true
  }
];