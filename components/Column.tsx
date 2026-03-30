'use client'

import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { TaskCard } from './TaskCard'
import type { Task, TaskStatus } from '@/lib/types'

interface Props {
  id: TaskStatus
  label: string
  tasks: Task[]
  onAddTask?: () => void
  onDeleteTask?: (taskId: string) => void
  canEdit?: boolean
}

const COLUMN_ACCENT: Record<TaskStatus, string> = {
  todo: 'border-t-gray-300',
  inprogress: 'border-t-blue-400',
  done: 'border-t-green-400',
}

const COLUMN_COUNT_BG: Record<TaskStatus, string> = {
  todo: 'bg-gray-100 text-gray-500',
  inprogress: 'bg-blue-50 text-blue-600',
  done: 'bg-green-50 text-green-600',
}

export function Column({ id, label, tasks, onAddTask, onDeleteTask, canEdit }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id })

  return (
    <div className={`flex flex-col bg-white border border-t-2 ${COLUMN_ACCENT[id]} rounded-lg overflow-hidden`}>
      {/* 헤더 */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold tracking-widest uppercase text-gray-500">{label}</span>
          <span className={`text-xs font-semibold rounded-full px-2 py-0.5 ${COLUMN_COUNT_BG[id]}`}>
            {tasks.length}
          </span>
        </div>
        {onAddTask && (
          <button
            onClick={onAddTask}
            className="text-gray-400 hover:text-gray-700 text-lg leading-none transition-colors"
            title="태스크 추가"
          >
            +
          </button>
        )}
      </div>

      {/* 카드 영역 */}
      <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div
          ref={setNodeRef}
          className={`flex-1 flex flex-col gap-2 p-2 min-h-[200px] transition-colors ${isOver ? 'bg-blue-50' : ''}`}
        >
          {tasks.length === 0 && (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-xs text-gray-300 text-center px-4">
                {id === 'todo' ? '할 일을 추가해보세요' : id === 'inprogress' ? '진행 중인 태스크' : '완료된 태스크'}
              </p>
            </div>
          )}
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onDelete={onDeleteTask}
              canEdit={canEdit}
            />
          ))}
        </div>
      </SortableContext>
    </div>
  )
}
