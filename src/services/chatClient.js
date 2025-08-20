// Chat client wrapper: uses REST for history and optional realtime for live updates
// Safe to import even if socket.io-client is not installed.
import { messagesAPI } from '../config/api'
import { initRealtime, getSocket, on as onSocket, emit as emitSocket } from './realtime'

let pollIntervals = new Map() // conversationId -> intervalId
let lastTimestamps = new Map() // conversationId -> ISO string

export async function initChat(authTokenProvider) {
  // Initialize realtime (no-op if socket.io-client missing)
  await initRealtime(authTokenProvider)
}

export function subscribeToNewMessages(conversationId, handler) {
  const sock = getSocket()
  if (sock) {
    // Join room and listen
    sock.emit('conversation:join', { conversationId })
    const off = onSocket('message:new', (payload) => {
      if (payload?.message?.conversationId === conversationId) handler(payload.message)
    })
    return () => {
      off?.()
      sock.emit('conversation:leave', { conversationId })
    }
  }

  // Fallback: polling
  startPolling(conversationId, handler)
  return () => stopPolling(conversationId)
}

export async function fetchHistory(conversationId, { cursor, limit = 50 } = {}) {
  const params = {}
  if (cursor) params.cursor = cursor
  if (limit) params.limit = limit
  const res = await messagesAPI.getMessages(conversationId, params)
  return res?.data || res
}

export async function fetchConversations() {
  const res = await messagesAPI.getConversations()
  return res?.data || res
}

export async function sendMessage(messageData) {
  // messageData should include conversationId, text, attachments[], clientMessageId
  const res = await messagesAPI.sendMessage(messageData)
  const msg = res?.data || res
  // Optimistically echo via socket if available
  const sock = getSocket()
  if (sock) emitSocket('message:new', { message: msg })
  return msg
}

function startPolling(conversationId, handler) {
  stopPolling(conversationId)
  const intervalId = setInterval(async () => {
    try {
      const since = lastTimestamps.get(conversationId)
      const params = since ? { since } : {}
      const res = await messagesAPI.getMessages(conversationId, params)
      const items = (res?.data || res || []).filter(Boolean)
      if (items.length > 0) {
        items.forEach(handler)
        const latest = items[items.length - 1]
        if (latest?.createdAt) lastTimestamps.set(conversationId, latest.createdAt)
      }
    } catch (err) {
      // Swallow intermittent failures
      console.warn('[Chat Polling] error:', err?.message || err)
    }
  }, 2000)
  pollIntervals.set(conversationId, intervalId)
}

function stopPolling(conversationId) {
  const id = pollIntervals.get(conversationId)
  if (id) clearInterval(id)
  pollIntervals.delete(conversationId)
}
