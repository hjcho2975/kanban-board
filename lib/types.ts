export type TaskStatus = 'todo' | 'inprogress' | 'done'
export type UserRole = 'leader' | 'member'

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  team_id: string | null
  created_at: string
}

export interface Board {
  id: string
  team_id: string
  name: string
  created_at: string
}

export interface Task {
  id: string
  title: string
  assignee_id: string | null
  due_date: string | null
  status: TaskStatus
  board_id: string
  created_at: string
  updated_at: string
  assignee?: User | null
}

// Supabase Database 타입
export type Database = {
  public: {
    Tables: {
      users: {
        Row: User
        Insert: Omit<User, 'created_at'>
        Update: Partial<Omit<User, 'id' | 'created_at'>>
      }
      boards: {
        Row: Board
        Insert: Omit<Board, 'id' | 'created_at'>
        Update: Partial<Omit<Board, 'id' | 'created_at'>>
      }
      tasks: {
        Row: Task
        Insert: Omit<Task, 'id' | 'created_at' | 'updated_at' | 'assignee'>
        Update: Partial<Omit<Task, 'id' | 'created_at' | 'updated_at' | 'assignee'>>
      }
    }
  }
}

export const COLUMNS: { id: TaskStatus; label: string }[] = [
  { id: 'todo', label: 'To Do' },
  { id: 'inprogress', label: 'In Progress' },
  { id: 'done', label: 'Done' },
]
