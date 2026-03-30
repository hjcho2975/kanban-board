'use client'

import { useState } from 'react'
import type { User, TaskStatus } from '@/lib/types'

interface Props {
  defaultStatus: TaskStatus
  currentUser: User
  teamMembers: User[]
  onSubmit: (data: { title: string; assignee_id: string; due_date: string; status: TaskStatus }) => Promise<void>
  onClose: () => void
}

export function AddTaskModal({ defaultStatus, currentUser, teamMembers, onSubmit, onClose }: Props) {
  const [title, setTitle] = useState('')
  const [assigneeId, setAssigneeId] = useState(currentUser.id)
  const [dueDate, setDueDate] = useState('')
  const [status, setStatus] = useState<TaskStatus>(defaultStatus)
  const [loading, setLoading] = useState(false)

  const isLeader = currentUser.role === 'leader'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setLoading(true)
    await onSubmit({ title: title.trim(), assignee_id: assigneeId, due_date: dueDate, status })
    setLoading(false)
  }

  return (
    <div
      className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-lg border border-gray-200 shadow-xl w-full max-w-sm">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <h2 className="text-sm font-bold">새 태스크</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-3">
          {/* 제목 */}
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">제목 *</label>
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="태스크 제목"
              required
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-gray-500"
            />
          </div>

          {/* 담당자 */}
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">담당자</label>
            {isLeader ? (
              <select
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-gray-500"
              >
                {teamMembers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name || m.email} {m.id === currentUser.id ? '(나)' : ''}
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-sm text-gray-500 py-1">
                {currentUser.name || currentUser.email} (나)
              </p>
            )}
          </div>

          {/* 마감일 */}
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">마감일</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-gray-500"
            />
          </div>

          {/* 상태 */}
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">상태</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as TaskStatus)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-gray-500"
            >
              <option value="todo">To Do</option>
              <option value="inprogress">In Progress</option>
              <option value="done">Done</option>
            </select>
          </div>

          <div className="flex gap-2 mt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-300 text-sm py-2 rounded hover:bg-gray-50 transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={loading || !title.trim()}
              className="flex-1 bg-gray-900 text-white text-sm py-2 rounded hover:bg-gray-700 disabled:opacity-50 transition-colors font-semibold"
            >
              {loading ? '추가 중...' : '추가'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
