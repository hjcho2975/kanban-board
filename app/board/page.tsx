import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { KanbanBoard } from '@/components/KanbanBoard'
import type { Task, User, Board } from '@/lib/types'

export default async function BoardPage() {
  const supabase = await createClient()

  // 현재 유저
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) redirect('/login')

  // users 테이블에서 프로필 조회
  let { data: currentUser } = await supabase
    .from('users')
    .select('*')
    .eq('id', authUser.id)
    .single()

  // 첫 로그인이면 프로필 + 팀 + 보드 생성
  if (!currentUser) {
    // 보드 먼저 생성 (team_id = board.id 로 단순화)
    const { data: board } = await supabase
      .from('boards')
      .insert({ name: '팀 보드', team_id: authUser.id }) // 임시 team_id
      .select()
      .single()

    if (board) {
      // team_id를 board.id로 업데이트
      await supabase
        .from('boards')
        .update({ team_id: board.id })
        .eq('id', board.id)

      // 유저 프로필 생성 (첫 사용자 = leader)
      const { data: newUser } = await supabase
        .from('users')
        .insert({
          id: authUser.id,
          email: authUser.email!,
          name: authUser.user_metadata?.full_name || authUser.email!.split('@')[0],
          role: 'leader',
          team_id: board.id,
        })
        .select()
        .single()

      currentUser = newUser
    }
  }

  if (!currentUser) {
    return <div className="p-8 text-sm text-gray-500">프로필 생성 중 오류가 발생했습니다. 새로고침해주세요.</div>
  }

  // 보드 조회
  const { data: board } = await supabase
    .from('boards')
    .select('*')
    .eq('team_id', currentUser.team_id)
    .single()

  if (!board) {
    return <div className="p-8 text-sm text-gray-500">보드를 찾을 수 없습니다. 새로고침해주세요.</div>
  }

  // 팀원 조회
  const { data: teamMembers } = await supabase
    .from('users')
    .select('*')
    .eq('team_id', currentUser.team_id)

  // 태스크 조회 (담당자 정보 포함)
  const { data: rawTasks } = await supabase
    .from('tasks')
    .select('*')
    .eq('board_id', board.id)
    .order('created_at', { ascending: true })

  const members = (teamMembers ?? []) as User[]
  const tasks: Task[] = (rawTasks ?? []).map((t) => ({
    ...t,
    assignee: members.find((m) => m.id === t.assignee_id) ?? null,
  }))

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* 헤더 */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <span className="font-bold text-base tracking-tight">TeamBoard</span>
          <span className="text-xs text-gray-400">{board.name}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500">
            {currentUser.name || currentUser.email}
            <span className="ml-1 text-gray-400">({currentUser.role === 'leader' ? '리더' : '팀원'})</span>
          </span>
          <LogoutButton />
        </div>
      </header>

      {/* 보드 제목 */}
      <div className="flex items-center justify-between px-4 py-3 flex-shrink-0">
        <div>
          <h1 className="text-lg font-bold tracking-tight">{board.name}</h1>
          <p className="text-xs text-gray-400">팀원 {members.length}명 · 태스크 {tasks.length}개</p>
        </div>
      </div>

      {/* 칸반 보드 */}
      <div className="flex-1 flex flex-col min-h-0">
        <KanbanBoard
          initialTasks={tasks}
          currentUser={currentUser as User}
          teamMembers={members}
          board={board as Board}
        />
      </div>
    </div>
  )
}

function LogoutButton() {
  return (
    <form action="/auth/signout" method="post">
      <button
        type="submit"
        className="text-xs text-gray-400 hover:text-gray-700 transition-colors"
      >
        로그아웃
      </button>
    </form>
  )
}
