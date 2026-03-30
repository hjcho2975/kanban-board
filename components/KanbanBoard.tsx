'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import { createClient } from '@/lib/supabase/client'
import { Column } from './Column'
import { TaskCard } from './TaskCard'
import { AddTaskModal } from './AddTaskModal'
import type { Task, User, TaskStatus, Board } from '@/lib/types'
import { COLUMNS } from '@/lib/types'

interface Props {
  initialTasks: Task[]
  currentUser: User
  teamMembers: User[]
  board: Board
}

export function KanbanBoard({ initialTasks, currentUser, teamMembers, board }: Props) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [modalStatus, setModalStatus] = useState<TaskStatus | null>(null)
  const [lastUpdate, setLastUpdate] = useState<string | null>(null)
  const isDraggingRef = useRef(false)
  const pendingRealtimeRef = useRef<Task[]>([])
  const supabase = createClient()

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  // Realtime 구독
  useEffect(() => {
    const channel = supabase
      .channel(`board:${board.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks', filter: `board_id=eq.${board.id}` },
        (payload) => {
          if (isDraggingRef.current) {
            // 드래그 중에는 incoming 이벤트를 보류
            return
          }
          applyRealtimeEvent(payload)
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [board.id])

  function applyRealtimeEvent(payload: { eventType: string; new: Record<string, unknown>; old: Record<string, unknown> }) {
    const { eventType, new: newRow, old: oldRow } = payload

    if (eventType === 'INSERT') {
      const inserted = newRow as Task
      // assignee 정보 붙이기
      const assignee = teamMembers.find((m) => m.id === inserted.assignee_id) ?? null
      const withAssignee = { ...inserted, assignee }
      setTasks((prev) => {
        if (prev.find((t) => t.id === inserted.id)) return prev
        setLastUpdate(`새 태스크가 추가됐습니다`)
        return [...prev, withAssignee]
      })
    } else if (eventType === 'UPDATE') {
      const updated = newRow as Task
      setTasks((prev) => {
        setLastUpdate(`태스크가 업데이트됐습니다`)
        return prev.map((t) => {
          if (t.id !== updated.id) return t
          const assignee = teamMembers.find((m) => m.id === updated.assignee_id) ?? null
          return { ...updated, assignee }
        })
      })
    } else if (eventType === 'DELETE') {
      const deleted = oldRow as { id: string }
      setTasks((prev) => {
        setLastUpdate(`태스크가 삭제됐습니다`)
        return prev.filter((t) => t.id !== deleted.id)
      })
    }
  }

  function getTasksByStatus(status: TaskStatus) {
    return tasks.filter((t) => t.status === status)
  }

  function handleDragStart(event: DragStartEvent) {
    isDraggingRef.current = true
    const task = tasks.find((t) => t.id === event.active.id)
    setActiveTask(task ?? null)
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event
    if (!over) return

    const activeId = String(active.id)
    const overId = String(over.id)
    if (activeId === overId) return

    const activeTask = tasks.find((t) => t.id === activeId)
    if (!activeTask) return

    // over가 컬럼인지 카드인지 판별
    const overIsColumn = COLUMNS.some((c) => c.id === overId)
    const targetStatus: TaskStatus = overIsColumn
      ? (overId as TaskStatus)
      : (tasks.find((t) => t.id === overId)?.status ?? activeTask.status)

    if (activeTask.status !== targetStatus) {
      setTasks((prev) =>
        prev.map((t) => (t.id === activeId ? { ...t, status: targetStatus } : t))
      )
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    isDraggingRef.current = false
    setActiveTask(null)

    if (!over) return

    const activeId = String(active.id)
    const overId = String(over.id)
    const task = tasks.find((t) => t.id === activeId)
    if (!task) return

    // 컬럼 또는 카드에 드롭된 경우 최종 status 결정
    const overIsColumn = COLUMNS.some((c) => c.id === overId)
    const finalStatus: TaskStatus = overIsColumn
      ? (overId as TaskStatus)
      : (tasks.find((t) => t.id === overId)?.status ?? task.status)

    // 낙관적 업데이트는 이미 dragOver에서 처리됨
    // DB에 저장
    await supabase
      .from('tasks')
      .update({ status: finalStatus })
      .eq('id', activeId)
  }

  const handleAddTask = useCallback(
    async (data: { title: string; assignee_id: string; due_date: string; status: TaskStatus }) => {
      const { data: inserted, error } = await supabase
        .from('tasks')
        .insert({
          title: data.title,
          assignee_id: data.assignee_id || null,
          due_date: data.due_date || null,
          status: data.status,
          board_id: board.id,
        })
        .select()
        .single()

      if (error || !inserted) return

      const assignee = teamMembers.find((m) => m.id === inserted.assignee_id) ?? null
      setTasks((prev) => [...prev, { ...inserted, assignee }])
      setModalStatus(null)
    },
    [board.id, teamMembers, supabase]
  )

  async function handleDeleteTask(taskId: string) {
    setTasks((prev) => prev.filter((t) => t.id !== taskId))
    await supabase.from('tasks').delete().eq('id', taskId)
  }

  const canEdit = (task: Task) =>
    currentUser.role === 'leader' || task.assignee_id === currentUser.id

  return (
    <>
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-3 gap-4 p-4 flex-1 min-h-0">
          {COLUMNS.map((col) => (
            <Column
              key={col.id}
              id={col.id}
              label={col.label}
              tasks={getTasksByStatus(col.id)}
              onAddTask={() => setModalStatus(col.id)}
              onDeleteTask={handleDeleteTask}
              canEdit={true}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTask && (
            <div className="rotate-2 scale-105">
              <TaskCard task={activeTask} isDragging />
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* 상태바 */}
      <div className="px-4 py-2 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400 bg-white">
        <span>
          {lastUpdate ? `마지막 업데이트: ${lastUpdate}` : '보드를 드래그하여 태스크 상태를 변경하세요'}
        </span>
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          실시간 연결됨
        </span>
      </div>

      {/* 태스크 추가 모달 */}
      {modalStatus && (
        <AddTaskModal
          defaultStatus={modalStatus}
          currentUser={currentUser}
          teamMembers={teamMembers}
          onSubmit={handleAddTask}
          onClose={() => setModalStatus(null)}
        />
      )}
    </>
  )
}
