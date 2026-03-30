'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Task } from '@/lib/types'

interface Props {
  task: Task
  isDragging?: boolean
  onDelete?: (taskId: string) => void
  canEdit?: boolean
}

function isOverdue(task: Task): boolean {
  if (!task.due_date || task.status === 'done') return false
  return new Date(task.due_date) < new Date(new Date().toDateString())
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return `${date.getMonth() + 1}/${date.getDate()}`
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || '?'
}

export function TaskCard({ task, isDragging = false, onDelete, canEdit }: Props) {
  const overdue = isOverdue(task)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.4 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={[
        'bg-white border rounded-md p-3 cursor-grab active:cursor-grabbing select-none group',
        overdue ? 'border-l-4 border-l-red-400 border-r border-t border-b border-gray-200' : 'border-gray-200',
        isDragging ? 'shadow-lg rotate-1' : 'hover:border-gray-300',
      ].join(' ')}
    >
      {/* 제목 */}
      <p className={`text-sm font-medium leading-snug mb-2 ${task.status === 'done' ? 'line-through text-gray-400' : 'text-gray-800'}`}>
        {task.title}
      </p>

      {/* 하단 메타 */}
      <div className="flex items-center justify-between">
        {/* 담당자 */}
        <div className="flex items-center gap-1.5">
          {task.assignee ? (
            <>
              <div className="w-5 h-5 rounded-full bg-gray-200 border border-gray-300 flex items-center justify-center text-[9px] font-bold text-gray-600 flex-shrink-0">
                {getInitials(task.assignee.name || task.assignee.email)}
              </div>
              <span className="text-xs text-gray-500 truncate max-w-[80px]">
                {task.assignee.name || task.assignee.email.split('@')[0]}
              </span>
            </>
          ) : (
            <span className="text-xs text-gray-400">미배정</span>
          )}
        </div>

        {/* 마감일 */}
        <div className="flex items-center gap-1">
          {task.due_date && (
            <span className={`text-xs ${overdue ? 'text-red-500 font-semibold' : 'text-gray-400'}`}>
              {overdue && '⚠ '}~{formatDate(task.due_date)}
            </span>
          )}
          {canEdit && onDelete && (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(task.id) }}
              className="ml-1 text-gray-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity text-xs"
              title="삭제"
            >
              ✕
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
