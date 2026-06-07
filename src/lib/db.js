/**
 * db.js — Supabase 数据库操作层
 * 所有函数 fire-and-forget：失败只打印，不阻塞 UI
 */
import { supabase } from './supabase'
import { LANE_ORDER, getLanguageTags } from './gameLogic'
import dayjs from 'dayjs'

// ─── 工具 ──────────────────────────────────────────────────
const ok = (label, { error, data }) => {
  if (error) console.error(`[db] ${label}:`, error.message)
  return data
}

// ─── 用户初始化（新注册时调用）────────────────────────────
export async function initUserData(userId, username = '勇士') {
  // 1. users 行
  await supabase.from('users').upsert({
    id: userId,
    username,
    balance: 0,
    focus_sequence: 0,
    streak_days: 0,
    language_config: { languages: ['英语'], abilities: ['听力', '阅读', '写作', '口语'] },
    lane_tags: { research: ['论文写作','文献阅读','数据处理','实地调研','理论框架','学术汇报'], study: ['AI开发'], fitness: [], work: [] },
  }, { onConflict: 'id' })

  // 2. lanes 行
  const laneRows = LANE_ORDER.map(laneId => ({
    user_id: userId, lane_id: laneId,
    total_stars: 0, tier: 'bronze', level: 3, stars_in_div: 0,
  }))
  await supabase.from('lanes').upsert(laneRows, { onConflict: 'user_id,lane_id' })

  // 3. 初始 tags 熟练度
  const tagRows = [
    ...['论文写作','文献阅读','数据处理','实地调研','理论框架','学术汇报'].map(t => ({ user_id: userId, lane_id: 'research', tag_name: t, points: 0 })),
    { user_id: userId, lane_id: 'study', tag_name: 'AI开发', points: 0 },
    ...getLanguageTags(['英语']).map(t => ({ user_id: userId, lane_id: 'language', tag_name: t, points: 0 })),
  ]
  await supabase.from('tags').upsert(tagRows, { onConflict: 'user_id,lane_id,tag_name' })
}

// ─── 加载用户全量数据 ────────────────────────────────────
export async function loadUserData(userId) {
  const [
    { data: userData },
    { data: lanesData },
    { data: tagsData },
    { data: tasksData },
    { data: focusData },
    { data: policiesData },
    { data: transData },
  ] = await Promise.all([
    supabase.from('users').select('*').eq('id', userId).single(),
    supabase.from('lanes').select('*').eq('user_id', userId),
    supabase.from('tags').select('*').eq('user_id', userId),
    supabase.from('tasks').select('*').eq('user_id', userId).order('created_at', { ascending: true }),
    supabase.from('focus_blocks').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(500),
    supabase.from('policies').select('*').eq('user_id', userId).order('created_at', { ascending: true }),
    supabase.from('transactions').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(500),
  ])
  return { userData, lanesData, tagsData, tasksData, focusData, policiesData, transData }
}

// ─── users 表 ─────────────────────────────────────────────
export const upsertUser = (userId, data) =>
  supabase.from('users').update(data).eq('id', userId)
    .then(r => ok('upsertUser', r))

// ─── lanes 表 ─────────────────────────────────────────────
export const upsertLane = (userId, laneId, data) =>
  supabase.from('lanes').upsert(
    { user_id: userId, lane_id: laneId, ...data },
    { onConflict: 'user_id,lane_id' }
  ).then(r => ok('upsertLane', r))

// ─── tags 表 ──────────────────────────────────────────────
export const upsertTag = (userId, laneId, tagName, points) =>
  supabase.from('tags').upsert(
    { user_id: userId, lane_id: laneId, tag_name: tagName, points },
    { onConflict: 'user_id,lane_id,tag_name' }
  ).then(r => ok('upsertTag', r))

// ─── tasks 表 ─────────────────────────────────────────────
export async function insertTask(userId, task) {
  const { data, error } = await supabase.from('tasks').insert({
    user_id: userId,
    title: task.title,
    description: task.desc || null,
    level: task.level,
    lane_id: task.laneId,
    difficulty: task.difficulty || 'medium',
    parent_id: task.parentId || null,
    completed: false,
  }).select().single()
  if (error) console.error('[db] insertTask:', error.message)
  return data // 返回含 id (UUID) 的完整行
}

export const updateTask = (taskId, data) =>
  supabase.from('tasks').update(data).eq('id', taskId)
    .then(r => ok('updateTask', r))

export const dbDeleteTask = (taskId) =>
  supabase.from('tasks').delete().eq('id', taskId)
    .then(r => ok('deleteTask', r))

// ─── focus_blocks 表 ──────────────────────────────────────
export const insertFocusBlock = (userId, block) =>
  supabase.from('focus_blocks').insert({
    user_id: userId,
    lane_id: block.laneId,
    tag: block.tag,
    difficulty: block.difficulty,
    duration_min: block.durationMin || 60,
    reward: block.reward,
    completed: block.completed,
  }).then(r => ok('insertFocusBlock', r))

// ─── policies 表 ──────────────────────────────────────────
export async function insertPolicy(userId, policy) {
  const { data, error } = await supabase.from('policies').insert({
    user_id: userId,
    name: policy.name,
    description: policy.desc || null,
    checked_dates: [],
  }).select().single()
  if (error) console.error('[db] insertPolicy:', error.message)
  return data
}

export const updatePolicyDates = (policyId, checkedDates) =>
  supabase.from('policies').update({ checked_dates: checkedDates }).eq('id', policyId)
    .then(r => ok('updatePolicyDates', r))

// ─── transactions 表 ──────────────────────────────────────
export const insertTransaction = (userId, { desc, amount, type, balance, category, note }) =>
  supabase.from('transactions').insert({
    user_id: userId,
    description: desc,
    amount,                   // 正=收入，负=支出
    type,
    balance_snapshot: balance,
    category: category || null,
    note: note || null,
  }).then(r => ok('insertTransaction', r))

export const deleteTransaction = (id) =>
  supabase.from('transactions').delete().eq('id', id).then(r => ok('deleteTransaction', r))
