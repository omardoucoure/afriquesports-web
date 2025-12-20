"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/use-auth"
import Image from "next/image"

interface WordPressComment {
  id: number
  post: number
  parent: number
  author: number
  author_name: string
  author_email: string
  author_url: string
  author_avatar_urls?: {
    24?: string
    48?: string
    96?: string
  }
  date: string
  content: {
    rendered: string
  }
  status: string
}

interface CommentSectionProps {
  articleId: string
  locale?: string
}

const translations = {
  fr: {
    title: "Commentaires",
    writeComment: "Écrire un commentaire",
    placeholder: "Partagez votre avis sur cet article...",
    signInRequired: "Connectez-vous pour commenter",
    signIn: "Se connecter avec Google",
    signOut: "Se déconnecter",
    submit: "Publier",
    reply: "Répondre",
    delete: "Supprimer",
    charactersLeft: "caractères restants",
    posting: "Publication...",
    loading: "Chargement des commentaires...",
    replyTo: "Répondre à",
    cancel: "Annuler",
    viewReplies: "Voir les réponses",
    hideReplies: "Masquer les réponses",
    comment: "commentaire",
    comments: "commentaires",
    noComments: "Soyez le premier à commenter",
    deleteConfirm: "Êtes-vous sûr de vouloir supprimer ce commentaire ?",
    errorPosting: "Une erreur s'est produite lors de la publication.",
    errorDeleting: "Vous n'avez pas la permission de supprimer ce commentaire."
  },
  en: {
    title: "Comments",
    writeComment: "Write a comment",
    placeholder: "Share your thoughts on this article...",
    signInRequired: "Sign in to comment",
    signIn: "Sign in with Google",
    signOut: "Sign out",
    submit: "Post",
    reply: "Reply",
    delete: "Delete",
    charactersLeft: "characters left",
    posting: "Posting...",
    loading: "Loading comments...",
    replyTo: "Reply to",
    cancel: "Cancel",
    viewReplies: "View replies",
    hideReplies: "Hide replies",
    comment: "comment",
    comments: "comments",
    noComments: "Be the first to comment",
    deleteConfirm: "Are you sure you want to delete this comment?",
    errorPosting: "An error occurred while posting.",
    errorDeleting: "You don't have permission to delete this comment."
  },
  es: {
    title: "Comentarios",
    writeComment: "Escribir un comentario",
    placeholder: "Comparte tu opinión sobre este artículo...",
    signInRequired: "Inicia sesión para comentar",
    signIn: "Iniciar sesión con Google",
    signOut: "Cerrar sesión",
    submit: "Publicar",
    reply: "Responder",
    delete: "Eliminar",
    charactersLeft: "caracteres restantes",
    posting: "Publicando...",
    loading: "Cargando comentarios...",
    replyTo: "Responder a",
    cancel: "Cancelar",
    viewReplies: "Ver respuestas",
    hideReplies: "Ocultar respuestas",
    comment: "comentario",
    comments: "comentarios",
    noComments: "Sé el primero en comentar",
    deleteConfirm: "¿Estás seguro de que quieres eliminar este comentario?",
    errorPosting: "Se produjo un error al publicar.",
    errorDeleting: "No tienes permiso para eliminar este comentario."
  }
}

// Icons as inline SVGs to avoid dependencies
const MessageCircleIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
)

const ReplyIcon = () => (
  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
  </svg>
)

const TrashIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
)

const SendIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
  </svg>
)

const LoaderIcon = () => (
  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </svg>
)

const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
)

export function CommentSection({ articleId, locale = 'fr' }: CommentSectionProps) {
  const t = translations[locale as keyof typeof translations] || translations.fr
  const { user, signInWithGoogle, signOut } = useAuth()
  const [comments, setComments] = useState<WordPressComment[]>([])
  const [newComment, setNewComment] = useState("")
  const [replyingTo, setReplyingTo] = useState<number | null>(null)
  const [replyContent, setReplyContent] = useState("")
  const [loading, setLoading] = useState(true)
  const [posting, setPosting] = useState(false)
  const [expandedReplies, setExpandedReplies] = useState<Set<number>>(new Set())
  const [isMounted, setIsMounted] = useState(false)

  const maxCommentLength = 1000

  // Fix hydration mismatch by only rendering dynamic dates on client
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Fetch comments from WordPress via API route
  useEffect(() => {
    const fetchComments = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/wordpress/comments?post=${articleId}&locale=${locale}`, {
          headers: {
            'Accept': 'application/json',
          }
        })

        if (response.ok) {
          const data = await response.json()
          setComments(data)
        }
      } catch (error) {
        console.error("Error fetching comments:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchComments()

    // Poll for new comments every 30 seconds
    const interval = setInterval(fetchComments, 30000)
    return () => clearInterval(interval)
  }, [articleId, locale])

  // Post new comment to WordPress via API route
  const handlePostComment = async () => {
    if (!user || !newComment.trim() || posting) return

    setPosting(true)
    try {
      const response = await fetch('/api/wordpress/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          articleId,
          authorName: user.displayName || 'Anonymous',
          authorEmail: user.email || 'noreply@afriquesports.net',
          authorPhotoUrl: user.photoURL || '',
          content: newComment.trim(),
          locale
        })
      })

      if (response.ok) {
        const newCommentData = await response.json()
        setComments([newCommentData, ...comments])
        setNewComment("")
      } else {
        console.error("Failed to post comment:", await response.text())
        alert(t.errorPosting)
      }
    } catch (error) {
      console.error("Error posting comment:", error)
      alert(t.errorPosting)
    } finally {
      setPosting(false)
    }
  }

  // Post reply to WordPress via API route
  const handlePostReply = async (parentId: number) => {
    if (!user || !replyContent.trim() || posting) return

    setPosting(true)
    try {
      const response = await fetch('/api/wordpress/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          articleId,
          parent: parentId,
          authorName: user.displayName || 'Anonymous',
          authorEmail: user.email || 'noreply@afriquesports.net',
          authorPhotoUrl: user.photoURL || '',
          content: replyContent.trim(),
          locale
        })
      })

      if (response.ok) {
        const newReplyData = await response.json()
        setComments([newReplyData, ...comments])
        setReplyContent("")
        setReplyingTo(null)
        setExpandedReplies(prev => new Set(prev).add(parentId))
      } else {
        console.error("Failed to post reply:", await response.text())
        alert(t.errorPosting)
      }
    } catch (error) {
      console.error("Error posting reply:", error)
      alert(t.errorPosting)
    } finally {
      setPosting(false)
    }
  }

  // Delete comment via API route
  const handleDelete = async (commentId: number) => {
    if (!user || !confirm(t.deleteConfirm)) return

    try {
      const response = await fetch(`/api/wordpress/comments?id=${commentId}&locale=${locale}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      if (response.ok) {
        setComments(comments.filter(c => c.id !== commentId))
      } else {
        alert(t.errorDeleting)
      }
    } catch (error) {
      console.error("Error deleting comment:", error)
    }
  }

  // Toggle replies visibility
  const toggleReplies = (commentId: number) => {
    setExpandedReplies(prev => {
      const newSet = new Set(prev)
      if (newSet.has(commentId)) {
        newSet.delete(commentId)
      } else {
        newSet.add(commentId)
      }
      return newSet
    })
  }

  // Format timestamp
  const formatTimestamp = (dateString: string) => {
    const date = new Date(dateString)

    // Avoid hydration mismatch: show static date until mounted
    if (!isMounted) {
      return date.toLocaleDateString(
        locale === 'en' ? 'en-US' : locale === 'es' ? 'es-ES' : 'fr-FR',
        { day: 'numeric', month: 'short', year: 'numeric' }
      )
    }

    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return locale === 'fr' ? "À l'instant" : locale === 'es' ? "Ahora mismo" : "Just now"
    if (diffMins < 60) return `${diffMins} min`
    if (diffHours < 24) return `${diffHours} h`
    if (diffDays < 7) return `${diffDays} ${locale === 'fr' ? 'j' : 'd'}`

    return date.toLocaleDateString(
      locale === 'en' ? 'en-US' : locale === 'es' ? 'es-ES' : 'fr-FR',
      { day: 'numeric', month: 'short', year: 'numeric' }
    )
  }

  // Get avatar URL - Prioritize Google photos over Gravatar
  const getAvatarUrl = (comment: WordPressComment) => {
    if (user && comment.author_email === user.email && user.photoURL) {
      return user.photoURL
    }
    if (comment.author_url && comment.author_url.includes('googleusercontent.com')) {
      return comment.author_url
    }
    return comment.author_avatar_urls?.['48'] || comment.author_avatar_urls?.['96'] || null
  }

  // Strip HTML from comment content (consistent on server and client)
  const stripHtml = (html: string) => {
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#039;/g, "'")
      .trim()
  }

  // Get top-level comments (no parent)
  const topLevelComments = comments.filter(c => c.parent === 0)

  // Get replies for a comment
  const getReplies = (parentId: number) => {
    return comments.filter(c => c.parent === parentId).sort((a, b) =>
      new Date(a.date).getTime() - new Date(b.date).getTime()
    )
  }

  // Render comment component
  const renderComment = (comment: WordPressComment, isReply = false) => {
    const avatarUrl = getAvatarUrl(comment)
    const replies = getReplies(comment.id)
    const isExpanded = expandedReplies.has(comment.id)
    const commentText = stripHtml(comment.content.rendered)

    return (
      <div
        key={comment.id}
        className={`${isReply ? 'ml-6 sm:ml-8' : ''} group`}
        itemScope
        itemType="https://schema.org/Comment"
      >
        <div className="flex gap-2 sm:gap-3">
          {/* User Avatar */}
          <div className="flex-shrink-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full overflow-hidden bg-gradient-to-br from-[#04453f] to-[#067a6e] flex items-center justify-center">
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt={comment.author_name}
                  width={36}
                  height={36}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-white font-bold text-sm">
                  {comment.author_name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
          </div>

          {/* Comment Content */}
          <div className="flex-1 min-w-0">
            <div className="bg-gray-50 rounded-xl px-3 py-2 sm:px-4 sm:py-3">
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div>
                  <h4 className="font-bold text-gray-900 text-xs sm:text-sm" itemProp="author">
                    {comment.author_name}
                  </h4>
                  <time
                    className="text-[10px] sm:text-xs text-gray-500"
                    dateTime={comment.date}
                    itemProp="datePublished"
                  >
                    {formatTimestamp(comment.date)}
                  </time>
                </div>
                {user?.email === comment.author_email && (
                  <button
                    onClick={() => handleDelete(comment.id)}
                    className="text-gray-400 hover:text-red-500 transition-colors p-1"
                    aria-label={t.delete}
                  >
                    <TrashIcon />
                  </button>
                )}
              </div>
              <p className="text-gray-800 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap" itemProp="text">
                {commentText}
              </p>
            </div>

            {/* Comment Actions */}
            <div className="flex items-center gap-2 sm:gap-3 mt-1.5 ml-1">
              {!isReply && user && (
                <button
                  onClick={() => setReplyingTo(comment.id)}
                  className="flex items-center gap-1 text-[10px] sm:text-xs text-gray-500 hover:text-[#04453f] transition-colors"
                >
                  <ReplyIcon />
                  <span>{t.reply}</span>
                </button>
              )}

              {!isReply && replies.length > 0 && (
                <button
                  onClick={() => toggleReplies(comment.id)}
                  className="flex items-center gap-1 text-[10px] sm:text-xs text-gray-500 hover:text-[#04453f] transition-colors font-medium"
                >
                  <MessageCircleIcon />
                  <span>
                    {replies.length} {isExpanded ? t.hideReplies : t.viewReplies}
                  </span>
                </button>
              )}
            </div>

            {/* Reply Form */}
            {replyingTo === comment.id && (
              <div className="mt-3 ml-1">
                <div className="flex gap-2">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-[#04453f] to-[#067a6e] flex items-center justify-center">
                      {user?.photoURL ? (
                        <Image
                          src={user.photoURL}
                          alt={user.displayName || "User"}
                          width={32}
                          height={32}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-white font-bold text-xs">
                          {user?.displayName?.charAt(0).toUpperCase() || "U"}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex-1">
                    <textarea
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value.slice(0, maxCommentLength))}
                      placeholder={`${t.replyTo} ${comment.author_name}...`}
                      className="w-full px-4 py-3 border-2 border-[#04453f]/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#04453f] focus:border-[#04453f] resize-none text-sm shadow-sm bg-white font-medium transition-all duration-200"
                      rows={3}
                      maxLength={maxCommentLength}
                    />
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-400">
                        {maxCommentLength - replyContent.length} {t.charactersLeft}
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setReplyingTo(null)
                            setReplyContent("")
                          }}
                          className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                        >
                          {t.cancel}
                        </button>
                        <button
                          onClick={() => handlePostReply(comment.id)}
                          disabled={!replyContent.trim() || posting}
                          className="px-4 py-2 bg-[#04453f] hover:bg-[#033630] text-white text-sm font-semibold rounded-full transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          {posting ? <LoaderIcon /> : t.submit}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Nested Replies */}
            {!isReply && isExpanded && replies.length > 0 && (
              <div className="mt-3 space-y-3">
                {replies.map((reply) => renderComment(reply, true))}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <section
      id="comment-section"
      className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6"
      aria-label={t.title}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-4 pb-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-gradient-to-br from-[#04453f] to-[#067a6e] rounded-lg">
            <MessageCircleIcon />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{t.title}</h2>
            <p className="text-xs text-gray-500">
              {topLevelComments.length} {topLevelComments.length === 1 ? t.comment : t.comments}
            </p>
          </div>
        </div>
        {user && (
          <button
            onClick={signOut}
            className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
          >
            {t.signOut}
          </button>
        )}
      </div>

      {/* Comment Form */}
      {user ? (
        <div className="mb-6">
          <h3 className="text-base font-semibold text-gray-900 mb-3">{t.writeComment}</h3>
          <div className="flex gap-3">
            <div className="flex-shrink-0">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden bg-gradient-to-br from-[#04453f] to-[#067a6e] flex items-center justify-center">
                {user.photoURL ? (
                  <Image
                    src={user.photoURL}
                    alt={user.displayName || "User"}
                    width={40}
                    height={40}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-white font-bold text-sm">
                    {user.displayName?.charAt(0).toUpperCase() || "U"}
                  </span>
                )}
              </div>
            </div>
            <div className="flex-1">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value.slice(0, maxCommentLength))}
                placeholder={t.placeholder}
                className="w-full px-4 py-3 border-2 border-[#04453f]/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#04453f] focus:border-[#04453f] resize-none shadow-sm bg-white text-sm font-medium transition-all duration-200"
                rows={3}
                maxLength={maxCommentLength}
                aria-label={t.writeComment}
              />
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-gray-400">
                  {maxCommentLength - newComment.length} {t.charactersLeft}
                </span>
                <button
                  onClick={handlePostComment}
                  disabled={!newComment.trim() || posting}
                  className="bg-[#04453f] hover:bg-[#033630] text-white px-5 py-2 rounded-full font-semibold transition-all duration-300 transform hover:scale-105 flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {posting ? (
                    <>
                      <LoaderIcon />
                      {t.posting}
                    </>
                  ) : (
                    <>
                      <SendIcon />
                      {t.submit}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="mb-6 p-5 bg-gradient-to-br from-[#04453f]/5 via-green-50 to-emerald-50 rounded-xl border-2 border-[#04453f]/10 shadow-sm">
          <p className="text-gray-800 text-base font-semibold mb-4 text-center">{t.signInRequired}</p>
          <button
            onClick={signInWithGoogle}
            className="w-full sm:w-auto mx-auto bg-white hover:bg-gray-50 text-gray-800 border-2 border-gray-200 px-6 py-2.5 rounded-full font-bold transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2 shadow-md hover:shadow-lg text-sm"
          >
            <GoogleIcon />
            {t.signIn}
          </button>
        </div>
      )}

      {/* Comments List */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <LoaderIcon />
          <span className="ml-2 text-gray-600 text-sm">{t.loading}</span>
        </div>
      ) : topLevelComments.length > 0 ? (
        <div className="space-y-4">
          {topLevelComments.map((comment) => renderComment(comment))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <MessageCircleIcon />
          <p className="mt-2">{t.noComments}</p>
        </div>
      )}
    </section>
  )
}
