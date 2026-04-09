'use client';

import { useState } from 'react';
import { ScrollReveal } from '@/components/Animations';
import styles from './page.module.css';
import { IconSparkles, IconLightbulb, IconClipboard, IconStar } from '@/components/Icons';

const SUBJECTS = ['DBMS', 'OS', 'DSA', 'CN', 'SE'];

const SUMMARIES = {
    'DBMS': [
        { unit: 'Unit 1', title: 'Introduction & ER Model', points: ['DBMS vs File System', 'ER Diagram components', 'Entities, Attributes, Relationships', 'Mapping cardinalities', 'Keys: Primary, Candidate, Super, Foreign'] },
        { unit: 'Unit 2', title: 'Relational Model & SQL', points: ['Relational algebra operations', 'SQL DDL, DML, DCL', 'Joins: Inner, Outer, Cross, Self', 'Aggregate functions and GROUP BY', 'Subqueries and nested queries'] },
        { unit: 'Unit 3', title: 'Normalization', points: ['Functional dependencies', '1NF, 2NF, 3NF, BCNF', 'Decomposition: Lossless join', 'Dependency preservation', 'Canonical cover'] },
        { unit: 'Unit 4', title: 'Transactions & Concurrency', points: ['ACID properties', 'Serializability: Conflict & View', 'Two-Phase Locking (2PL)', 'Deadlock detection and prevention', 'Timestamp-based protocols'] },
        { unit: 'Unit 5', title: 'Indexing & File Organization', points: ['Primary, Secondary, Dense, Sparse indexing', 'B-tree and B+ tree', 'Hashing: Static and Dynamic', 'RAID levels', 'Query optimization basics'] },
    ],
    'OS': [
        { unit: 'Unit 1', title: 'OS Basics & Process', points: ['Types of OS: Batch, Multiprogramming, Time-Sharing', 'Process states & PCB', 'System calls', 'Threads: User vs Kernel', 'Context switching'] },
        { unit: 'Unit 2', title: 'CPU Scheduling', points: ['FCFS, SJF, SRTF, Round Robin, Priority', 'Gantt chart problems', 'Avg waiting & turnaround time', 'Multilevel Queue Scheduling', 'Multilevel Feedback Queue'] },
        { unit: 'Unit 3', title: 'Deadlocks & Synchronization', points: ['Deadlock conditions', 'Bankers Algorithm', 'Resource Allocation Graph', 'Mutex, Semaphore, Monitor', 'Producer-Consumer, Readers-Writers'] },
        { unit: 'Unit 4', title: 'Memory Management', points: ['Paging and Segmentation', 'Page replacement: FIFO, LRU, Optimal', 'TLB and page tables', 'Virtual memory concepts', 'Thrashing and Working Set'] },
    ],
    'DSA': [
        { unit: 'Unit 1', title: 'Arrays & Linked Lists', points: ['Time complexity: O(1), O(n), O(log n)', 'Singly, Doubly, Circular linked lists', 'Stack using array and linked list', 'Queue: Simple, Circular, Priority', 'Applications of Stack and Queue'] },
        { unit: 'Unit 2', title: 'Trees', points: ['Binary Tree traversals: Inorder, Preorder, Postorder', 'BST operations: Insert, Delete, Search', 'AVL tree rotations', 'Heap: Min and Max heap', 'Huffman coding'] },
        { unit: 'Unit 3', title: 'Graphs', points: ['BFS and DFS traversals', 'Dijkstra, Bellman-Ford shortest path', 'Prims and Kruskals MST', 'Topological sorting', 'Cycle detection in directed/undirected'] },
        { unit: 'Unit 4', title: 'Sorting & Searching', points: ['Comparison-based: Merge, Quick, Heap sort', 'Linear sorts: Counting, Radix', 'Binary Search variations', 'Hashing and collision resolution', 'Time complexity comparison table'] },
    ],
    'CN': [
        { unit: 'Unit 1', title: 'Network Models', points: ['OSI 7-layer model', 'TCP/IP model', 'Comparison of OSI vs TCP/IP', 'Network topologies', 'Switching: Circuit, Packet, Message'] },
        { unit: 'Unit 2', title: 'Data Link Layer', points: ['Framing, Error Detection, Error Correction', 'Hamming code, CRC', 'Flow Control: Stop-and-Wait, Sliding Window', 'MAC protocols: ALOHA, CSMA/CD, CSMA/CA', 'Ethernet and IEEE 802.3'] },
        { unit: 'Unit 3', title: 'Network Layer', points: ['IPv4 addressing and subnetting', 'CIDR and VLSM', 'Routing: RIP, OSPF, BGP', 'NAT and DHCP', 'IPv6 basics'] },
    ],
    'SE': [
        { unit: 'Unit 1', title: 'SDLC Models', points: ['Waterfall, Spiral, Agile, V-model', 'Agile vs Waterfall comparison', 'Scrum framework', 'Requirements engineering process', 'Feasibility study types'] },
        { unit: 'Unit 2', title: 'Design & UML', points: ['Class, Use case, Sequence diagrams', 'Activity and State diagrams', 'Coupling and Cohesion', 'Design patterns: Singleton, Factory, Observer', 'Component-based design'] },
        { unit: 'Unit 3', title: 'Testing', points: ['Black box vs White box testing', 'Unit, Integration, System, Acceptance', 'Test case design techniques', 'Regression testing', 'Software metrics: LOC, Function Point'] },
    ],
};

const IMP_QUESTIONS = {
    'DBMS': [
        { q: 'Explain the different types of keys in DBMS with examples.', marks: '5 marks' },
        { q: 'What is normalization? Explain 1NF, 2NF, 3NF, and BCNF with examples.', marks: '10 marks' },
        { q: 'Explain ACID properties of transactions.', marks: '5 marks' },
        { q: 'Write SQL queries for JOIN operations with examples.', marks: '10 marks' },
        { q: 'Explain B-tree and B+ tree with insertion examples.', marks: '10 marks' },
        { q: 'What is deadlock in DBMS? Explain prevention methods.', marks: '5 marks' },
        { q: 'Describe the two-phase locking protocol.', marks: '5 marks' },
        { q: 'Explain relational algebra with examples.', marks: '10 marks' },
    ],
    'OS': [
        { q: 'Explain Bankers Algorithm with a numerical example.', marks: '10 marks' },
        { q: 'Compare FCFS, SJF, and Round Robin scheduling with Gantt charts.', marks: '10 marks' },
        { q: 'Explain paging and segmentation with diagrams.', marks: '10 marks' },
        { q: 'Solve a page replacement problem using FIFO, LRU, and Optimal.', marks: '10 marks' },
        { q: 'Explain the Producer-Consumer problem using semaphores.', marks: '5 marks' },
        { q: 'What are the necessary conditions for deadlock?', marks: '5 marks' },
    ],
    'DSA': [
        { q: 'Write an algorithm for AVL tree insertion with rotations.', marks: '10 marks' },
        { q: 'Explain BFS and DFS with examples and applications.', marks: '10 marks' },
        { q: 'Compare Merge Sort and Quick Sort. Write algorithms.', marks: '10 marks' },
        { q: 'Explain Dijkstras shortest path algorithm with example.', marks: '10 marks' },
        { q: 'What is hashing? Explain collision resolution techniques.', marks: '5 marks' },
        { q: 'Implement a stack using two queues.', marks: '5 marks' },
    ],
    'CN': [
        { q: 'Compare OSI and TCP/IP models with a detailed diagram.', marks: '10 marks' },
        { q: 'Explain subnetting with CIDR notation and solve a numerical.', marks: '10 marks' },
        { q: 'Explain Stop-and-Wait and Sliding Window protocols.', marks: '10 marks' },
        { q: 'What is CSMA/CD? How it differs from CSMA/CA?', marks: '5 marks' },
        { q: 'Explain CRC error detection with an example.', marks: '5 marks' },
    ],
    'SE': [
        { q: 'Compare Waterfall and Agile methodologies.', marks: '10 marks' },
        { q: 'Draw and explain Use Case and Sequence Diagrams.', marks: '10 marks' },
        { q: 'What is coupling and cohesion? Explain types.', marks: '5 marks' },
        { q: 'Explain Black Box and White Box testing techniques.', marks: '10 marks' },
        { q: 'What are Function Points? Explain the calculation.', marks: '5 marks' },
    ],
};

export default function ExamModePage() {
    const [selected, setSelected] = useState('DBMS');

    const summaries = SUMMARIES[selected] || [];
    const questions = IMP_QUESTIONS[selected] || [];

    return (
        <div className={styles.pageWrapper}>
            <div className={styles.pageInner}>
                {/* Header */}
                <ScrollReveal>
                    <div className={styles.examHeader}>
                        <span className={styles.examIcon}><IconSparkles size={48} /></span>
                        <h1 className={styles.examTitle}>
                            <span className={`${styles.examTitleAccent} text-shimmer`}>Last Night</span> Prep
                        </h1>
                        <p className={styles.examDesc}>
                            Quick unit-wise summaries and important questions for your upcoming exams. Study smart, not hard.
                        </p>
                    </div>
                </ScrollReveal>

                {/* Subject Chips */}
                <ScrollReveal delay={100}>
                    <div className={styles.subjectSelector}>
                        {SUBJECTS.map(sub => (
                            <button
                                key={sub}
                                className={`${styles.subjectChip} ${selected === sub ? styles.subjectChipActive : ''}`}
                                onClick={() => setSelected(sub)}
                            >
                                {sub}
                            </button>
                        ))}
                    </div>
                </ScrollReveal>

                {/* Tip */}
                <ScrollReveal delay={200}>
                    <div className={styles.tipCard}>
                        <div className={styles.tipTitle}><IconLightbulb size={20} /> Pro Tip</div>
                        <div className={styles.tipText}>
                            Focus on the unit-wise key points below. These cover 80% of what is asked in exams. Practice the important questions at the bottom — they are the most frequently repeated.
                        </div>
                    </div>
                </ScrollReveal>

                {/* Unit Summaries */}
                <ScrollReveal delay={300}>
                    <h2 className={styles.sectionTitle}><IconClipboard size={28} /> Unit-wise Summary — {selected}</h2>
                </ScrollReveal>
                <div className={styles.summaryGrid}>
                    {summaries.map((s, i) => (
                        <ScrollReveal key={i} delay={i * 100}>
                            <div className={`${styles.summaryCard} hover-lift`}>
                                <span className={styles.unitLabel}>{s.unit}</span>
                                <h3 className={styles.summaryTitle}>{s.title}</h3>
                                <div className={styles.summaryPoints}>
                                    {s.points.map((p, j) => (
                                        <div key={j} className={styles.summaryPoint}>{p}</div>
                                    ))}
                                </div>
                            </div>
                        </ScrollReveal>
                    ))}
                </div>

                {/* Important Questions */}
                <ScrollReveal>
                    <h2 className={styles.sectionTitle}><IconStar size={28} /> Important Questions — {selected}</h2>
                </ScrollReveal>
                <div className={styles.questionsGrid}>
                    {questions.map((q, i) => (
                        <ScrollReveal key={i} delay={i * 80}>
                            <div className={`${styles.questionCard} hover-lift`}>
                                <div className={styles.questionNum}>{i + 1}</div>
                                <div className={styles.questionContent}>
                                    <div className={styles.questionText}>{q.q}</div>
                                    <div className={styles.questionMarks}>{q.marks}</div>
                                </div>
                            </div>
                        </ScrollReveal>
                    ))}
                </div>
            </div>
        </div>
    );
}
