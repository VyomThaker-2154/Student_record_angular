import { Component, OnInit } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import Chart from 'chart.js/auto';

interface Student {
  id: number;
  name: string;
  age: number;
  grade: string;
  email: string;
  attendance: number;
  subjects: string[];
  enrollmentDate: Date;
  lastUpdated: Date;
}

interface Toast {
  message: string;
  type: 'success' | 'error';
}

interface GradeValues {
  [key: string]: number;
}

interface GradeCount {
  [key: string]: number;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [FormsModule, CommonModule],
  template: `
    <div class="container">
      <!-- Toast Notifications -->
      <div *ngIf="toast" [class]="'toast toast-' + toast.type">
        {{ toast.message }}
      </div>

      <h1>Student Management System</h1>
      
      <!-- Dashboard -->
      <div class="dashboard">
        <div class="row">
          <div class="col-md-3">
            <div class="dashboard-card">
              <div class="dashboard-stat">{{ students.length }}</div>
              <div class="stat-label">Total Students</div>
            </div>
          </div>
          <div class="col-md-3">
            <div class="dashboard-card">
              <div class="dashboard-stat">{{ averageGrade | number:'1.1-1' }}</div>
              <div class="stat-label">Average Grade</div>
            </div>
          </div>
          <div class="col-md-3">
            <div class="dashboard-card">
              <div class="dashboard-stat">{{ averageAttendance | number:'1.0-0' }}%</div>
              <div class="stat-label">Average Attendance</div>
            </div>
          </div>
        </div>
        
        <div class="chart-container">
          <canvas id="gradeDistribution"></canvas>
        </div>
      </div>

      <!-- Search and Filter -->
      <div class="filters">
        <div class="search-box">
          <input 
            type="text" 
            [(ngModel)]="searchTerm" 
            placeholder="Search students..."
            (input)="applyFilters()"
          >
        </div>
        <div class="filter-options">
          <select [(ngModel)]="gradeFilter" (change)="applyFilters()">
            <option value="">All Grades</option>
            <option *ngFor="let grade of uniqueGrades" [value]="grade">{{ grade }}</option>
          </select>
          <button (click)="sortBy('name')" class="sort-btn">
            Sort by Name
            <i [class]="sortField === 'name' ? (sortAsc ? '↑' : '↓') : ''"></i>
          </button>
          <button (click)="sortBy('grade')" class="sort-btn">
            Sort by Grade
            <i [class]="sortField === 'grade' ? (sortAsc ? '↑' : '↓') : ''"></i>
          </button>
        </div>
      </div>

      <!-- Add Student Form -->
      <div class="form-section">
        <h2>Add New Student</h2>
        <form (ngSubmit)="addStudent()" #studentForm="ngForm">
          <div class="form-row">
            <div class="form-group">
              <label>Name:</label>
              <input 
                type="text" 
                [(ngModel)]="newStudent.name" 
                name="name" 
                required 
                pattern="[A-Za-z ]{2,50}"
                #name="ngModel"
              >
              <div class="error" *ngIf="name.invalid && name.touched">
                Please enter a valid name (2-50 characters)
              </div>
            </div>
            <div class="form-group">
              <label>Email:</label>
              <input 
                type="email" 
                [(ngModel)]="newStudent.email" 
                name="email" 
                required
                pattern="[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$"
                #email="ngModel"
              >
              <div class="error" *ngIf="email.invalid && email.touched">
                Please enter a valid email address
              </div>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Age:</label>
              <input 
                type="number" 
                [(ngModel)]="newStudent.age" 
                name="age" 
                required
                min="15"
                max="25"
                #age="ngModel"
              >
              <div class="error" *ngIf="age.invalid && age.touched">
                Age must be between 15 and 25
              </div>
            </div>
            <div class="form-group">
              <label>Grade:</label>
              <select [(ngModel)]="newStudent.grade" name="grade" required>
                <option value="">Select Grade</option>
                <option value="A+">A+</option>
                <option value="A">A</option>
                <option value="B+">B+</option>
                <option value="B">B</option>
                <option value="C">C</option>
                <option value="D">D</option>
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Attendance (%):</label>
              <input 
                type="number" 
                [(ngModel)]="newStudent.attendance" 
                name="attendance" 
                required
                min="0"
                max="100"
                #attendance="ngModel"
              >
              <div class="error" *ngIf="attendance.invalid && attendance.touched">
                Attendance must be between 0 and 100
              </div>
            </div>
            <div class="form-group">
              <label>Subjects:</label>
              <div class="checkbox-group">
                <label *ngFor="let subject of availableSubjects">
                  <input 
                    type="checkbox"
                    [value]="subject"
                    (change)="onSubjectChange($event, subject)"
                  >
                  {{ subject }}
                </label>
              </div>
            </div>
          </div>
          <button type="submit" [disabled]="!studentForm.form.valid">Add Student</button>
        </form>
      </div>

      <!-- Students List -->
      <div class="students-list">
        <h2>Students List</h2>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Age</th>
              <th>Grade</th>
              <th>Attendance</th>
              <th>Subjects</th>
              <th>Enrollment Date</th>
              <th>Last Updated</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let student of filteredStudents" [class.low-attendance]="student.attendance < 75">
              <td>{{student.id}}</td>
              <td>
                <span *ngIf="!student.editing">{{student.name}}</span>
                <input *ngIf="student.editing" [(ngModel)]="student.name" name="name">
              </td>
              <td>
                <span *ngIf="!student.editing">{{student.email}}</span>
                <input *ngIf="student.editing" type="email" [(ngModel)]="student.email" name="email">
              </td>
              <td>
                <span *ngIf="!student.editing">{{student.age}}</span>
                <input *ngIf="student.editing" type="number" [(ngModel)]="student.age" name="age">
              </td>
              <td>
                <span *ngIf="!student.editing">{{student.grade}}</span>
                <select *ngIf="student.editing" [(ngModel)]="student.grade" name="grade">
                  <option value="A+">A+</option>
                  <option value="A">A</option>
                  <option value="B+">B+</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                  <option value="D">D</option>
                </select>
              </td>
              <td>
                <span *ngIf="!student.editing">{{student.attendance}}%</span>
                <input *ngIf="student.editing" type="number" [(ngModel)]="student.attendance" name="attendance">
              </td>
              <td>
                <span class="subjects-list">{{student.subjects.join(', ')}}</span>
              </td>
              <td>{{student.enrollmentDate | date:'short'}}</td>
              <td>{{student.lastUpdated | date:'short'}}</td>
              <td class="actions">
                <button (click)="toggleEdit(student)" class="btn-edit">
                  <i [class]="student.editing ? 'fas fa-save' : 'fas fa-edit'"></i>
                  {{student.editing ? 'Save' : 'Edit'}}
                </button>
                <button (click)="deleteStudent(student.id)" class="btn-delete">
                  <i class="fas fa-trash"></i>
                  Delete
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }
    
    .dashboard {
      margin-bottom: 30px;
    }
    
    .row {
      display: flex;
      gap: 20px;
      margin-bottom: 20px;
    }
    
    .col-md-3 {
      flex: 1;
    }
    
    .filters {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      background: white;
      padding: 15px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    
    .search-box input {
      padding: 8px 15px;
      border: 1px solid #ddd;
      border-radius: 4px;
      width: 300px;
    }
    
    .filter-options {
      display: flex;
      gap: 10px;
    }
    
    .filter-options select {
      padding: 8px;
      border: 1px solid #ddd;
      border-radius: 4px;
    }
    
    .form-section {
      margin-bottom: 30px;
      padding: 20px;
      background-color: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    
    .form-row {
      display: flex;
      gap: 20px;
      margin-bottom: 15px;
    }
    
    .form-group {
      flex: 1;
    }
    
    .form-group label {
      display: block;
      margin-bottom: 5px;
      color: var(--dark-gray);
    }
    
    .form-group input,
    .form-group select {
      width: 100%;
      padding: 8px;
      border: 1px solid #ddd;
      border-radius: 4px;
    }
    
    .checkbox-group {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
    }
    
    .checkbox-group label {
      display: flex;
      align-items: center;
      gap: 5px;
    }
    
    .error {
      color: var(--danger-color);
      font-size: 0.8em;
      margin-top: 5px;
    }
    
    button {
      padding: 8px 15px;
      background-color: var(--secondary-color);
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      transition: background-color 0.3s;
    }
    
    button:hover {
      background-color: #2980b9;
    }
    
    button:disabled {
      background-color: #bdc3c7;
      cursor: not-allowed;
    }
    
    .students-list {
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
    }
    
    th, td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #ddd;
    }
    
    th {
      background-color: var(--primary-color);
      color: white;
    }
    
    tr:nth-child(even) {
      background-color: #f8f9fa;
    }
    
    tr:hover {
      background-color: #f1f2f6;
    }
    
    .low-attendance {
      background-color: #ffebee;
    }
    
    .actions {
      display: flex;
      gap: 5px;
    }
    
    .btn-edit {
      background-color: var(--warning-color);
    }
    
    .btn-delete {
      background-color: var(--danger-color);
    }
    
    .subjects-list {
      display: inline-block;
      max-width: 200px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    
    @media (max-width: 1024px) {
      .form-row {
        flex-direction: column;
      }
      
      .filters {
        flex-direction: column;
        gap: 10px;
      }
      
      .search-box input {
        width: 100%;
      }
    }
  `]
})
export class App implements OnInit {
  students: (Student & { editing?: boolean })[] = [
    {
      id: 1,
      name: 'John Doe',
      email: 'john@example.com',
      age: 18,
      grade: 'A',
      attendance: 95,
      subjects: ['Mathematics', 'Physics', 'Chemistry'],
      enrollmentDate: new Date('2023-09-01'),
      lastUpdated: new Date()
    },
    {
      id: 2,
      name: 'Jane Smith',
      email: 'jane@example.com',
      age: 17,
      grade: 'B+',
      attendance: 88,
      subjects: ['Biology', 'Chemistry', 'English'],
      enrollmentDate: new Date('2023-09-01'),
      lastUpdated: new Date()
    },
    {
      id: 3,
      name: 'Bob Johnson',
      email: 'bob@example.com',
      age: 19,
      grade: 'A-',
      attendance: 72,
      subjects: ['Physics', 'Computer Science'],
      enrollmentDate: new Date('2023-09-01'),
      lastUpdated: new Date()
    }
  ];

  newStudent: Partial<Student> = {
    name: '',
    email: '',
    age: 0,
    grade: '',
    attendance: 100,
    subjects: []
  };

  availableSubjects = [
    'Mathematics',
    'Physics',
    'Chemistry',
    'Biology',
    'Computer Science',
    'English',
    'History'
  ];

  searchTerm: string = '';
  gradeFilter: string = '';
  sortField: string = '';
  sortAsc: boolean = true;
  filteredStudents: (Student & { editing?: boolean })[] = [];
  toast: Toast | null = null;
  
  get uniqueGrades(): string[] {
    return [...new Set(this.students.map(s => s.grade))].sort();
  }

  get averageGrade(): number {
    const gradeValues: GradeValues = {
      'A+': 4.0, 'A': 4.0, 'A-': 3.7,
      'B+': 3.3, 'B': 3.0, 'B-': 2.7,
      'C+': 2.3, 'C': 2.0, 'C-': 1.7,
      'D+': 1.3, 'D': 1.0, 'F': 0.0
    };
    
    const total = this.students.reduce((sum, student) => {
      return sum + (gradeValues[student.grade] || 0);
    }, 0);
    
    return total / this.students.length;
  }

  get averageAttendance(): number {
    return this.students.reduce((sum, student) => sum + student.attendance, 0) / this.students.length;
  }

  ngOnInit() {
    this.applyFilters();
    this.initializeCharts();
  }

  initializeCharts() {
    const ctx = document.getElementById('gradeDistribution') as HTMLCanvasElement;
    const gradeCount: GradeCount = {};
    this.students.forEach(student => {
      gradeCount[student.grade] = (gradeCount[student.grade] || 0) + 1;
    });

    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: Object.keys(gradeCount),
        datasets: [{
          label: 'Grade Distribution',
          data: Object.values(gradeCount),
          backgroundColor: '#3498db',
          borderColor: '#2980b9',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1
            }
          }
        }
      }
    });
  }

  showToast(message: string, type: 'success' | 'error') {
    this.toast = { message, type };
    setTimeout(() => this.toast = null, 3000);
  }

  onSubjectChange(event: any, subject: string) {
    if (!this.newStudent.subjects) {
      this.newStudent.subjects = [];
    }
    
    if (event.target.checked) {
      this.newStudent.subjects.push(subject);
    } else {
      this.newStudent.subjects = this.newStudent.subjects.filter(s => s !== subject);
    }
  }

  addStudent() {
    if (this.validateStudent(this.newStudent)) {
      const id = Math.max(...this.students.map(s => s.id)) + 1;
      const newStudent: Student = {
        id,
        name: this.newStudent.name!,
        email: this.newStudent.email!,
        age: this.newStudent.age!,
        grade: this.newStudent.grade!,
        attendance: this.newStudent.attendance!,
        subjects: this.newStudent.subjects || [],
        enrollmentDate: new Date(),
        lastUpdated: new Date()
      };
      
      this.students.push(newStudent);
      this.applyFilters();
      this.showToast('Student added successfully!', 'success');
      
      // Reset form
      this.newStudent = {
        name: '',
        email: '',
        age: 0,
        grade: '',
        attendance: 100,
        subjects: []
      };
      
      this.initializeCharts();
    }
  }

  validateStudent(student: Partial<Student>): boolean {
    if (!student.name || student.name.length < 2) {
      this.showToast('Please enter a valid name', 'error');
      return false;
    }
    if (!student.email || !student.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      this.showToast('Please enter a valid email address', 'error');
      return false;
    }
    if (!student.age || student.age < 15 || student.age > 25) {
      this.showToast('Age must be between 15 and 25', 'error');
      return false;
    }
    if (!student.grade) {
      this.showToast('Please select a grade', 'error');
      return false;
    }
    if (!student.attendance || student.attendance < 0 || student.attendance > 100) {
      this.showToast('Attendance must be between 0 and 100', 'error');
      return false;
    }
    return true;
  }

  toggleEdit(student: Student & { editing?: boolean }) {
    if (student.editing) {
      if (this.validateStudent(student)) {
        student.editing = false;
        student.lastUpdated = new Date();
        this.showToast('Student updated successfully!', 'success');
        this.initializeCharts();
      }
    } else {
      student.editing = true;
    }
  }

  deleteStudent(id: number) {
    if (confirm('Are you sure you want to delete this student?')) {
      this.students = this.students.filter(student => student.id !== id);
      this.applyFilters();
      this.showToast('Student deleted successfully!', 'success');
      this.initializeCharts();
    }
  }

  applyFilters() {
    this.filteredStudents = this.students
      .filter(student => {
        const matchesSearch = student.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                            student.email.toLowerCase().includes(this.searchTerm.toLowerCase());
        const matchesGrade = !this.gradeFilter || student.grade === this.gradeFilter;
        return matchesSearch && matchesGrade;
      });

    if (this.sortField) {
      this.filteredStudents.sort((a, b) => {
        const aValue = (a as any)[this.sortField];
        const bValue = (b as any)[this.sortField];
        return this.sortAsc ? 
          aValue.localeCompare(bValue) : 
          bValue.localeCompare(aValue);
      });
    }
  }

  sortBy(field: string) {
    if (this.sortField === field) {
      this.sortAsc = !this.sortAsc;
    } else {
      this.sortField = field;
      this.sortAsc = true;
    }
    this.applyFilters();
  }
}

bootstrapApplication(App);