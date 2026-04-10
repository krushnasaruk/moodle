/**
 * Centralized Subject Mapping
 * Branch → Year → Semester → Subjects[]
 */

export const COLLEGES = [
    'Government College of Engineering',
    'MIT World Peace University',
    'Vishwakarma Institute of Technology',
    'PICT Pune',
    'COEP Technological University',
    'Savitribai Phule Pune University',
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

export const SUBJECT_MAP = {
    Computer: {
        'Sem 1': ['Engineering Mathematics I', 'Physics', 'Chemistry', 'BEE', 'Indian Knowledge System (IKS)', 'FPL', 'PPS'],
        'Sem 2': ['Engineering Mathematics II', 'Engineering Mechanics', 'Workshop', 'Communication Skills', 'Environmental Science'],
        'Sem 3': ['DBMS', 'Data Structures', 'Digital Electronics', 'Engineering Mathematics III', 'Discrete Mathematics'],
        'Sem 4': ['Operating Systems', 'Computer Networks', 'Theory of Computation', 'Computer Organization', 'Engineering Mathematics IV'],
        'Sem 5': ['Software Engineering', 'Machine Learning', 'Web Technology', 'Microprocessor', 'Elective I'],
        'Sem 6': ['Compiler Design', 'Cloud Computing', 'Artificial Intelligence', 'Cryptography', 'Elective II'],
        'Sem 7': ['Deep Learning', 'Big Data Analytics', 'IoT', 'Project I', 'Elective III'],
        'Sem 8': ['Blockchain', 'Cyber Security', 'Project II', 'Elective IV'],
    },
    IT: {
        'Sem 1': ['Engineering Mathematics I', 'Physics', 'Chemistry', 'BEE', 'Indian Knowledge System (IKS)', 'FPL', 'PPS'],
        'Sem 2': ['Engineering Mathematics II', 'Engineering Mechanics', 'Workshop', 'Communication Skills', 'Environmental Science'],
        'Sem 3': ['DBMS', 'Data Structures', 'Digital Electronics', 'Engineering Mathematics III', 'Web Development'],
        'Sem 4': ['Operating Systems', 'Computer Networks', 'Software Engineering', 'Computer Organization', 'Engineering Mathematics IV'],
        'Sem 5': ['Cloud Computing', 'Machine Learning', 'Information Security', 'Mobile Computing', 'Elective I'],
        'Sem 6': ['Data Science', 'Artificial Intelligence', 'DevOps', 'Distributed Systems', 'Elective II'],
        'Sem 7': ['IoT', 'NLP', 'Project I', 'Elective III', 'Elective IV'],
        'Sem 8': ['Blockchain', 'Project II', 'Elective V'],
    },
    Mechanical: {
        'Sem 1': ['Engineering Mathematics I', 'Physics', 'Chemistry', 'BEE', 'Engineering Graphics', 'Indian Knowledge System (IKS)', 'FPL', 'PPS'],
        'Sem 2': ['Engineering Mathematics II', 'Engineering Mechanics', 'Workshop', 'Thermodynamics I', 'Environmental Science'],
        'Sem 3': ['Fluid Mechanics', 'Strength of Materials', 'Thermodynamics II', 'Engineering Mathematics III', 'Manufacturing Processes'],
        'Sem 4': ['Kinematics of Machinery', 'Heat Transfer', 'Machine Design I', 'Engineering Mathematics IV', 'Material Science'],
        'Sem 5': ['Machine Design II', 'Industrial Engineering', 'CAD/CAM', 'Dynamics of Machinery', 'Elective I'],
        'Sem 6': ['Automobile Engineering', 'Refrigeration & AC', 'FEA', 'Robotics', 'Elective II'],
        'Sem 7': ['Power Plant Engineering', 'Project I', 'Elective III', 'Elective IV'],
        'Sem 8': ['Project II', 'Elective V'],
    },
    Civil: {
        'Sem 1': ['Engineering Mathematics I', 'Physics', 'Chemistry', 'BEE', 'Engineering Graphics', 'Indian Knowledge System (IKS)', 'FPL', 'PPS'],
        'Sem 2': ['Engineering Mathematics II', 'Engineering Mechanics', 'Workshop', 'Surveying I', 'Environmental Science'],
        'Sem 3': ['Structural Analysis I', 'Fluid Mechanics', 'Building Construction', 'Engineering Mathematics III', 'Surveying II'],
        'Sem 4': ['Structural Analysis II', 'Geotechnical Engineering', 'Hydraulics', 'Engineering Mathematics IV', 'Transportation Engineering'],
        'Sem 5': ['RCC Design', 'Steel Structures', 'Environmental Engineering', 'Estimation & Costing', 'Elective I'],
        'Sem 6': ['Foundation Engineering', 'Water Resources', 'Construction Management', 'Advanced Surveying', 'Elective II'],
        'Sem 7': ['Earthquake Engineering', 'Project I', 'Elective III', 'Elective IV'],
        'Sem 8': ['Project II', 'Elective V'],
    },
    Electrical: {
        'Sem 1': ['Engineering Mathematics I', 'Physics', 'Chemistry', 'BEE', 'Indian Knowledge System (IKS)', 'FPL', 'PPS'],
        'Sem 2': ['Engineering Mathematics II', 'Engineering Mechanics', 'Workshop', 'Circuit Theory', 'Environmental Science'],
        'Sem 3': ['Electrical Machines I', 'Network Analysis', 'Electronics', 'Engineering Mathematics III', 'Electromagnetic Theory'],
        'Sem 4': ['Electrical Machines II', 'Power Systems I', 'Control Systems', 'Engineering Mathematics IV', 'Signals & Systems'],
        'Sem 5': ['Power Systems II', 'Power Electronics', 'Instrumentation', 'Microprocessor', 'Elective I'],
        'Sem 6': ['Switchgear & Protection', 'Electric Drives', 'Digital Signal Processing', 'Renewable Energy', 'Elective II'],
        'Sem 7': ['HVDC', 'Project I', 'Elective III', 'Elective IV'],
        'Sem 8': ['Project II', 'Elective V'],
    },
    Electronics: {
        'Sem 1': ['Engineering Mathematics I', 'Physics', 'Chemistry', 'BEE', 'Indian Knowledge System (IKS)', 'FPL', 'PPS'],
        'Sem 2': ['Engineering Mathematics II', 'Engineering Mechanics', 'Workshop', 'Circuit Theory', 'Environmental Science'],
        'Sem 3': ['Analog Electronics', 'Digital Electronics', 'Network Analysis', 'Engineering Mathematics III', 'Signals & Systems'],
        'Sem 4': ['Microprocessor', 'Communication Systems', 'Control Systems', 'Engineering Mathematics IV', 'Electromagnetic Theory'],
        'Sem 5': ['VLSI Design', 'Microcontrollers', 'Digital Communication', 'Antenna Theory', 'Elective I'],
        'Sem 6': ['Embedded Systems', 'Optical Communication', 'DSP', 'Wireless Communication', 'Elective II'],
        'Sem 7': ['Satellite Communication', 'Project I', 'Elective III', 'Elective IV'],
        'Sem 8': ['Project II', 'Elective V'],
    },
};

/**
 * Get subjects for a given branch and semester
 */
export function getSubjects(branch, semester) {
    return SUBJECT_MAP[branch]?.[semester] || [];
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
