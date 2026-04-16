/**
 * Centralized Subject Mapping for SPPU (2019 Pattern)
 * Branch → Year → Semester → Subjects[]
 */

export const COLLEGES = [
    'Government College of Engineering',
    'MIT World Peace University',
    'Vishwakarma Institute of Technology',
    'PICT Pune',
    'COEP Technological University',
    'Savitribai Phule Pune University',
    'Dhole Patil College of Engineering Pune',
    'Other',
];

export const BRANCHES = ['Computer', 'IT', 'Mechanical', 'Civil', 'Electrical', 'Electronics'];

export const YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year'];

export const SEMESTERS = {
    '1st Year': ['Sem 1', 'Sem 2'],
    '2nd Year': ['Sem 3', 'Sem 4'],
    '3rd Year': ['Sem 5', 'Sem 6'],
    '4th Year': ['Sem 7', 'Sem 8'],
};

// First Year (FE) is Common for all branches in SPPU
const FESem1 = [
    'Engineering Mathematics I', 
    'Physics', 
    'Systems in Mechanical Engineering', 
    'BEE', 
    'FPL', 
    'PPS', 
    'IKS', 
    'Workshop Practice'
];
const FESem2 = [
    'Engineering Mathematics II', 
    'Chemistry', 
    'Basic Electronics Engineering', 
    'Engineering Mechanics', 
    'Engineering Graphics', 
    'Project Based Learning'
];

export const SUBJECT_MAP = {
    Computer: {
        'Sem 1': FESem1,
        'Sem 2': FESem2,
        'Sem 3': ['Discrete Mathematics', 'Fundamentals of Data Structures', 'Object Oriented Programming', 'Computer Graphics', 'Digital Electronics and Logic Design', 'Data Structures Laboratory', 'OOP and Computer Graphics Laboratory', 'Digital Electronics Laboratory'],
        'Sem 4': ['Engineering Mathematics III', 'Data Structures and Algorithms', 'Software Engineering', 'Microprocessor', 'Principles of Programming Languages', 'DSA Laboratory', 'Microprocessor Laboratory', 'Project Based Learning II'],
        'Sem 5': ['Database Management Systems', 'Theory of Computation', 'Systems Programming and Operating System', 'Computer Networks and Security', 'Elective I', 'Database Management Systems Laboratory', 'Systems Programming and Operating System Laboratory', 'Laboratory Practice I'],
        'Sem 6': ['Data Science and Big Data Analytics', 'Web Technology', 'Artificial Intelligence', 'Elective II', 'Internship', 'Data Science and Big Data Analytics Laboratory', 'Web Technology Laboratory', 'Laboratory Practice II'],
        'Sem 7': ['Design and Analysis of Algorithms', 'Machine Learning', 'Blockchain Technology', 'Elective III', 'Elective IV', 'Laboratory Practice III', 'Laboratory Practice IV', 'Project Work Stage I'],
        'Sem 8': ['High Performance Computing', 'Deep Learning', 'Elective V', 'Elective VI', 'Laboratory Practice V', 'Laboratory Practice VI', 'Project Work Stage II'],
    },
    IT: {
        'Sem 1': FESem1,
        'Sem 2': FESem2,
        'Sem 3': ['Discrete Mathematics', 'Logic Design and Computer Organization', 'Data Structures and Algorithms', 'Object Oriented Programming', 'Basic of Computer Network', 'Data Structure and Algorithm Laboratory', 'OOP Laboratory', 'Computer Network Laboratory'],
        'Sem 4': ['Engineering Mathematics III', 'Processor Architecture', 'Database Management System', 'Computer Graphics', 'Software Engineering', 'Processor Architecture Laboratory', 'DBMS Laboratory', 'Computer Graphics Laboratory', 'Project Based Learning'],
        'Sem 5': ['Theory of Computation', 'Operating Systems', 'Machine Learning', 'Human Computer Interaction', 'Elective I', 'Operating Systems Laboratory', 'Machine Learning Laboratory', 'Laboratory Practice I'],
        'Sem 6': ['Computer Networks and Security', 'Data Science and Big Data Analytics', 'Web Application Development', 'Elective II', 'Internship', 'Computer Network and Security Laboratory', 'DSBDA Laboratory', 'Laboratory Practice II'],
        'Sem 7': ['Information and Cyber Security', 'Machine Learning and Deep Learning', 'Design and Analysis of Algorithms', 'Elective III', 'Elective IV', 'Laboratory Practice III', 'Laboratory Practice IV', 'Project Phase I'],
        'Sem 8': ['Distributed Systems', 'Software Design and Modeling', 'Elective V', 'Elective VI', 'Laboratory Practice V', 'Laboratory Practice VI', 'Project Phase II'],
    },
    Mechanical: {
        'Sem 1': FESem1,
        'Sem 2': FESem2,
        'Sem 3': ['Solid Mechanics', 'Solid Modeling and Drafting', 'Engineering Thermodynamics', 'Engineering Materials and Metallurgy', 'Electrical and Electronics Engineering', 'Geometric Modeling Lab', 'Thermodynamics Lab'],
        'Sem 4': ['Fluid Mechanics', 'Kinematics of Machinery', 'Applied Thermodynamics', 'Machining Science and Technology', 'Project Based Learning', 'Fluid Mechanics Lab', 'Kinematics Lab', 'Machine Shop'],
        'Sem 5': ['Numerical & Statistical Methods', 'Heat & Mass Transfer', 'Design of Machine Elements', 'Mechatronics', 'Elective I', 'Heat Transfer Lab', 'Mechatronics Lab'],
        'Sem 6': ['Artificial Intelligence & Machine Learning', 'Computer Aided Engineering', 'Design of Transmission Systems', 'Composite Materials', 'Elective II', 'CAE Lab', 'Internship'],
        'Sem 7': ['Dynamics of Machinery', 'Turbomachinery', 'Elective III', 'Elective IV', 'Dynamics Lab', 'Turbomachinery Lab', 'Project Stage I'],
        'Sem 8': ['Computer Integrated Manufacturing', 'Energy Engineering', 'Elective V', 'Elective VI', 'CIM Lab', 'Energy Lab', 'Project Stage II'],
    },
    Civil: {
        'Sem 1': FESem1,
        'Sem 2': FESem2,
        'Sem 3': ['Building Technology and Architectural Planning', 'Mechanics of Structures', 'Fluid Mechanics', 'Engineering Mathematics III', 'Engineering Geology'],
        'Sem 4': ['Geotechnical Engineering', 'Surveying', 'Concrete Technology', 'Structural Analysis', 'Project Based Learning'],
        'Sem 5': ['Hydrology and Water Resources Engineering', 'Infrastructure Engineering and Construction Techniques', 'Structural Design I', 'Elective I', 'Elective II'],
        'Sem 6': ['Advanced Surveying', 'Project Management and Engineering Economics', 'Foundation Engineering', 'Structural Design II', 'Elective III', 'Internship'],
        'Sem 7': ['Environmental Engineering I', 'Transportation Engineering', 'Elective IV', 'Elective V', 'Project Phase I'],
        'Sem 8': ['Dams and Hydraulic Structures', 'Quantity Surveying, Contracts and Tenders', 'Elective VI', 'Elective VII', 'Project Phase II'],
    },
    Electrical: {
        'Sem 1': FESem1,
        'Sem 2': FESem2,
        'Sem 3': ['Power Generation Technologies', 'Material Science', 'Analog and Digital Electronics', 'Electrical Measurement and Instrumentation', 'Engineering Mathematics III'],
        'Sem 4': ['Power System I', 'Electrical Machines I', 'Network Analysis', 'Numerical Methods and Computer Programming', 'Fundamental of Microcontroller and Applications'],
        'Sem 5': ['Industrial and Technology Management', 'Power System II', 'Electrical Machines II', 'Power Electronics', 'Elective I'],
        'Sem 6': ['Energy Audit and Management', 'Power System Operation and Control', 'Control System', 'Elective II', 'Internship'],
        'Sem 7': ['PLC and SCADA', 'Power Quality', 'Elective III', 'Elective IV', 'Project Phase I'],
        'Sem 8': ['Smart Grid', 'Electric and Hybrid Vehicles', 'Elective V', 'Elective VI', 'Project Phase II'],
    },
    Electronics: {
        'Sem 1': FESem1,
        'Sem 2': FESem2,
        'Sem 3': ['Engineering Mathematics III', 'Electronic Circuits', 'Digital Circuits', 'Electrical Circuits', 'Data Structures'],
        'Sem 4': ['Signals and Systems', 'Control Systems', 'Principles of Communication Systems', 'Object Oriented Programming', 'Project Based Learning'],
        'Sem 5': ['Digital Communication', 'Microcontrollers', 'Electromagnetic Field Theory', 'Database Management', 'Elective I'],
        'Sem 6': ['Cellular Networks', 'Project Management', 'Power Devices and Circuits', 'Elective II', 'Internship'],
        'Sem 7': ['VLSI Design and Technology', 'Computer Networks and Security', 'Elective III', 'Elective IV', 'Project Phase I'],
        'Sem 8': ['Radiation and Microwave Theory', 'Automotive Electronics', 'Elective V', 'Elective VI', 'Project Phase II'],
    },
};

/**
 * Get subjects for a given branch and semester
 */
export function getSubjects(branch, semester) {
    return SUBJECT_MAP[branch]?.[semester] || [];
}

/**
 * Get subjects for a whole year (both semesters combined)
 */
export function getSubjectsByYear(branch, year) {
    const sems = SEMESTERS[year] || [];
    const subs = new Set();
    sems.forEach(sem => {
        const semSubs = SUBJECT_MAP[branch]?.[sem] || [];
        semSubs.forEach(s => subs.add(s));
    });
    return [...subs];
}

/**
 * Get all unique subjects across all branches for a flat list
 */
export function getAllSubjects() {
    const all = new Set();
    Object.values(SUBJECT_MAP).forEach(yearMap => {
        Object.values(yearMap).forEach(subjects => {
            subjects.forEach(s => all.add(s));
        });
    });
    return [...all].sort();
}
