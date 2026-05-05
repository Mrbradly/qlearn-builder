const devices = [
  { assetNumber: 'MSHS-LAP-0001', serialNumber: '8X2XJY3', model: 'Dell Latitude 5440', type: 'Laptop', status: 'available', warranty: '14 Jun 2026', days: '365 days', assignedTo: '–' },
  { assetNumber: 'MSHS-LAP-0002', serialNumber: '1FZ2K73', model: 'Dell Latitude 5440', type: 'Laptop', status: 'loaned', warranty: '21 Dec 2025', days: '190 days', assignedTo: 'Year 11 Student\nA. Johnson (11B)' },
  { assetNumber: 'MSHS-LAP-0003', serialNumber: '3H5QRX1', model: 'Dell Latitude 5440', type: 'Laptop', status: 'loaned', warranty: '03 Nov 2025', days: '142 days', assignedTo: 'Year 10 Student\nL. Smith (10A)' },
  { assetNumber: 'MSHS-LAP-0004', serialNumber: '7K8PZL2', model: 'Dell Latitude 5440', type: 'Laptop', status: 'damaged', warranty: '14 Jun 2025', days: '-17 days', assignedTo: '–' },
  { assetNumber: 'MSHS-LAP-0005', serialNumber: '9D6MNV7', model: 'Dell Latitude 5440', type: 'Laptop', status: 'available', warranty: '28 Aug 2026', days: '440 days', assignedTo: '–' },
  { assetNumber: 'MSHS-LAP-0006', serialNumber: '2N7WKP8', model: 'Dell Latitude 5440', type: 'Laptop', status: 'loaned', warranty: '10 Feb 2026', days: '241 days', assignedTo: 'Year 12 Student\nM. Patel (12C)' },
  { assetNumber: 'MSHS-LAP-0007', serialNumber: '6Y3TMD0', model: 'Dell Latitude 5440', type: 'Laptop', status: 'out_of_warranty', warranty: '12 Mar 2024', days: 'Expired', assignedTo: 'Staff\nJ. Brown' },
  { assetNumber: 'MSHS-LAP-0008', serialNumber: '5P1RLH4', model: 'Dell Latitude 5440', type: 'Laptop', status: 'available', warranty: '19 Jul 2026', days: '400 days', assignedTo: '–' }
];

const loans = [
  { initials: 'OL', name: 'Oliver Lawson', id: 'S1234567', year: 'Year 10', device: 'MacBook Air (M1)', tag: 'MBA-1047', type: 'Short-Term', issued: '14 May 2025', expected: '14 Jun 2025', dueText: '16 days left', status: 'active' },
  { initials: 'EM', name: 'Emily McKenzie', id: 'S1234580', year: 'Year 11', device: 'Dell Latitude 5440', tag: 'DLT-5440-62', type: 'Long-Term', issued: '20 Feb 2025', expected: '20 Aug 2025', dueText: '83 days left', status: 'active' },
  { initials: 'JT', name: 'Jackson Turner', id: 'S1234502', year: 'Year 9', device: 'MacBook Air (M1)', tag: 'MBA-1063', type: 'Short-Term', issued: '28 May 2025', expected: '04 Jun 2025', dueText: '6 days left', status: 'due_soon' },
  { initials: 'IS', name: 'Isabella Sutton', id: 'S1234544', year: 'Year 12', device: 'Dell Latitude 5440', tag: 'DLT-5440-48', type: 'Long-Term', issued: '10 Jan 2025', expected: '10 Jul 2025', dueText: '42 days left', status: 'active' },
  { initials: 'LH', name: 'Lucas Hart', id: 'S1234511', year: 'Year 10', device: 'MacBook Air (M1)', tag: 'MBA-1022', type: 'Short-Term', issued: '01 May 2025', expected: '25 May 2025', dueText: 'Overdue by 6 days', status: 'overdue' },
  { initials: 'CA', name: 'Chloe Anderson', id: 'S1234559', year: 'Year 11', device: 'Dell Latitude 5440', tag: 'DLT-5440-35', type: 'Long-Term', issued: '18 Mar 2025', expected: '18 Sep 2025', dueText: '112 days left', status: 'active' },
  { initials: 'BM', name: 'Ben Morrison', id: 'S1234523', year: 'Year 9', device: 'MacBook Air (M1)', tag: 'MBA-1009', type: 'Short-Term', issued: '22 May 2025', expected: '29 May 2025', dueText: 'Overdue by 2 days', status: 'overdue' },
  { initials: 'SR', name: 'Sophie Richards', id: 'S1234578', year: 'Year 12', device: 'Dell Latitude 5440', tag: 'DLT-5440-71', type: 'Long-Term', issued: '05 Feb 2025', expected: '05 Aug 2025', dueText: '68 days left', status: 'active' }
];

const issues = [
  { ref: 'ISS-2025-1047', person: 'Ms. Laura Carter', role: 'Teacher', location: 'Science Lab 2', type: 'Hardware', urgency: 'high', status: 'open', assigned: 'Unassigned' },
  { ref: 'ISS-2025-1046', person: 'Mr. Daniel Smith', role: 'Teacher', location: 'Room 7B', type: 'Network', urgency: 'medium', status: 'in_progress', assigned: 'James Patel' },
  { ref: 'ISS-2025-1045', person: 'Ms. Amy Williams', role: 'Teacher', location: 'Library', type: 'Software', urgency: 'low', status: 'open', assigned: 'Unassigned' },
  { ref: 'ISS-2025-1044', person: 'Mr. Michael Brown', role: 'Teacher', location: 'Room 3C', type: 'Hardware', urgency: 'medium', status: 'open', assigned: 'Sarah Nguyen' },
  { ref: 'ISS-2025-1043', person: 'Mrs. Jessica Lee', role: 'Teacher', location: 'Admin Office', type: 'Account Access', urgency: 'low', status: 'resolved', assigned: 'James Patel' },
  { ref: 'ISS-2025-1042', person: 'Mr. Ethan Cole', role: 'Teacher', location: 'Room 9A', type: 'Hardware', urgency: 'high', status: 'in_progress', assigned: 'Sarah Nguyen' },
  { ref: 'ISS-2025-1041', person: 'Ms. Olivia Harris', role: 'Teacher', location: 'Student Hub', type: 'Network', urgency: 'medium', status: 'resolved', assigned: 'James Patel' },
  { ref: 'ISS-2025-1040', person: 'Mr. Benjamin White', role: 'Teacher', location: 'Room 1D', type: 'Software', urgency: 'low', status: 'resolved', assigned: 'Sarah Nguyen' },
  { ref: 'ISS-2025-1039', person: 'Ms. Sophie Turner', role: 'Teacher', location: 'Room 10C', type: 'Hardware', urgency: 'medium', status: 'open', assigned: 'Unassigned' },
  { ref: 'ISS-2025-1038', person: 'Mr. Liam Johnson', role: 'Teacher', location: 'Gym Office', type: 'Network', urgency: 'low', status: 'resolved', assigned: 'James Patel' }
];

const damageReports = [
  { date: '29 May 2025, 10:15 AM', lab: 'Science Lab 2', computer: '05', type: 'Broken Monitor', severity: 'moderate', student: 'John Smith (Year 10)', status: 'reported', reportedBy: 'Admin User' },
  { date: '28 May 2025, 2:42 PM', lab: 'Science Lab 1', computer: '12', type: 'Keyboard Malfunction', severity: 'minor', student: 'Unknown', status: 'investigating', reportedBy: 'Mark Peterson' },
  { date: '27 May 2025, 11:08 AM', lab: 'Science Lab 3', computer: '19', type: 'Spilled Liquid', severity: 'major', student: 'Sarah Lee (Year 9)', status: 'investigating', reportedBy: 'Admin User' },
  { date: '26 May 2025, 9:31 AM', lab: 'Science Lab 2', computer: '07', type: 'Mouse Not Working', severity: 'minor', student: 'Unknown', status: 'repaired', reportedBy: 'IT Technician' }
];


const parentApplications = [
  {
    id: 'APP-2026-001',
    studentName: 'Ava Nguyen',
    studentId: 'S1234991',
    yearLevel: 'Year 9',
    parentName: 'Sarah Nguyen',
    parentEmail: 'sarah.nguyen.parent@example.com',
    requestedLoanType: 'Short-Term',
    requestedDates: '06 May 2026 - 20 May 2026',
    reason: 'Student BYOx device is being repaired and is unavailable for classwork.',
    status: 'pending',
    submitted: '05 May 2026, 8:42 AM'
  },
  {
    id: 'APP-2026-002',
    studentName: 'Liam Carter',
    studentId: 'S1234880',
    yearLevel: 'Year 10',
    parentName: 'Rebecca Carter',
    parentEmail: 'rebecca.carter.parent@example.com',
    requestedLoanType: 'Short-Term',
    requestedDates: '07 May 2026 - 14 May 2026',
    reason: 'Device charger has failed and replacement has been ordered.',
    status: 'approved',
    submitted: '04 May 2026, 3:15 PM'
  }
];

const studentsNeedingLaptop = [
  {
    studentName: 'Liam Carter',
    studentId: 'S1234880',
    yearLevel: 'Year 10',
    sourceApplication: 'APP-2026-002',
    approvedBy: 'Bradly Saunders',
    status: 'Ready to assign',
    requestedLoanType: 'Short-Term'
  }
];


module.exports = { devices, loans, issues, damageReports, parentApplications, studentsNeedingLaptop };

