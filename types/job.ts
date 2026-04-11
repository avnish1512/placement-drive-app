export interface Job {
  id: string;
  title: string;
  company: string;
  companyLogo?: string;
  location: string;
  ctc: {
    min: number;
    max: number;
  };
  jobType: 'Full-Time' | 'Part-Time' | 'Internship' | 'Internship + Full-Time';
  industry: string;
  requirements: string[];
  description: string;
  skills: string[];
  eligibilityStatus: 'Eligible' | 'Not Eligible' | 'Applied';
  registrationDeadline: string;
  postedDate: string;
  isActive: boolean;
  driveDate?: string;
  eligibilityCriteria?: string;
  contactEmail?: string;
  contactPhone?: string;
}

export interface Application {
  id: string;
  jobId: string;
  studentId: string;
  studentName?: string;
  studentEmail?: string;
  studentCGPA?: number;
  studentCourse?: string;
  studentYear?: string;
  studentResume?: string;
  status: 'Applied' | 'Under Review' | 'Shortlisted' | 'Rejected' | 'Selected';
  appliedDate: string;
  adminNotes?: string;
  lastUpdated?: string;
}

export interface Student {
  id: string;
  name: string;
  email: string;
  phone: string;
  course: string;
  year: string;
  cgpa: number;
  skills: string[];
  resume?: string;
  resumePath?: string;
  resumeFileName?: string;
  resumeUploadedDate?: Date;
  address?: string;
  profilePhoto?: string;
  profilePhotoPath?: string;
  profileCompleted?: boolean;
}

export interface Company {
  id: string;
  name: string;
  industry: string;
  location: string;
  website?: string;
  contactEmail?: string;
  contactPhone?: string;
  description?: string;
  addedDate: string;
  isActive: boolean;
}