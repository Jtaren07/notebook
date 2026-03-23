'use client'
import Editor from "@/components/Editor"
import MDX from "@/components/MDX"
import SideNav from "@/components/SideNav"
import { useAuth } from "@/context/AuthContext"
import { db } from "@/firebase"
import { collection, doc, getDoc, getDocs, serverTimestamp, setDoc } from "firebase/firestore"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"

export default function NotesPage() {
    const [isViewer, setIsViewer] = useState(true)
    // const [text, setText] = useState('')
    const [showNav, setShowNav] = useState(false)
    const [note, setNote] = useState({
        content: ''
    })
    const [isLoading, setIsLoading] = useState(false)
    const [noteIds, setNoteIds] = useState([])
    const [savingNote, setSavingNote] = useState(false)

    const { currentUser, isLoadingUser } = useAuth()

    const searchParams = useSearchParams()
    const selectedId = searchParams.get('id')
    const router = useRouter()


    function handleToggleViewer() {
        // isViewer = !isViewer
        setIsViewer(!isViewer)
    }

    function handleToggleMenu() {
        setShowNav(!showNav)
    }

    function handleCreateNote() {
        // create a new note
        setNote({
            content: ''
        })
        setIsViewer(false)
        router.replace('/notes')
    }

    function handleEditNote(id) {
        setIsViewer(false)
        setShowNav(false)
        router.push(`/notes?id=${id}`)
    }

    function handleChange(e) {
        // edit an existing note
        setNote({ ...note, content: e.target.value })
    }

    async function handleSaveNote() {
        if (!note?.content) { return }
        setSavingNote(true)
        try {
            // see if note already exists in database
            if (note.id) {
                // then we have an existing note cause we have it's id, so write to existing note
                const noteRef = doc(db, 'users', currentUser.uid, 'notes', note.id)
                await setDoc(noteRef, { content: note.content, updatedAt: serverTimestamp() }, { merge: true })
            } else {
                // that means that it's a brand new note and will only contain the content field, so we can basically save a new note to firebase
                const newId = note.content.replace(/\s+/g, '').replace(/[^a-zA-Z0-9]/g, '').slice(0, 20) + '__' + Date.now()
                const notesRef = doc(db, 'users', currentUser.uid, 'notes', newId)
                await setDoc(notesRef, {
                    content: note.content,
                    createdAt: serverTimestamp()
                })
                setNoteIds(curr => [...curr, newId])
                setNote({ ...note, id: newId })
                router.push(`?id=${newId}`)
            }
        } catch (err) {
            console.log(err.message)
        } finally {
            setSavingNote(false)
        }
    }

    useEffect(() => {
        if (!currentUser) { return }
        async function fetchNotes() {
            try {
                const notesRef = collection(db, 'users', currentUser.uid, 'notes')
                const snapshot = await getDocs(notesRef)
                const notesIndexes = snapshot.docs.map((doc) => doc.id)
                setNoteIds(notesIndexes)
            } catch (err) {
                console.log(err.message)
            }
        }
        fetchNotes()
    }, [currentUser])

    useEffect(() => {
        // locally cache notes in a global context (like the one we already have, you perhaps just need an extra state)
        if (!currentUser) { return }
        if (!selectedId) {
            setNote({ content: '' })
            return
        }

        async function fetchNote() {
            try {
                setIsLoading(true)
                console.log('FETCHING DATA')
                const noteRef = doc(db, 'users', currentUser.uid, 'notes', selectedId)
                const snapshot = await getDoc(noteRef)
                const docData = snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null
                if (docData) {
                    setNote({ ...docData })
                }
            } catch (err) {
                console.log(err.message)
            } finally {
                setIsLoading(false)
            }
        }
        fetchNote()
    }, [currentUser, selectedId])

    useEffect(() => {
        if (!isLoadingUser && !currentUser) {
            router.push('/')
        }
    }, [currentUser, isLoadingUser, router])


    if (isLoadingUser) {
        return (
            <h6 className="text-gradient">Loading...</h6>
        )
    }

    if (!currentUser) {
        // Handled by the useEffect above
        return null
    }

    return (
        <main id="notes">
            <SideNav handleEditNote={handleEditNote} setIsViewer={setIsViewer} handleCreateNote={handleCreateNote} noteIds={noteIds} setNoteIds={setNoteIds} showNav={showNav} setShowNav={setShowNav} />
            {!isViewer && (
                <Editor key={note.id} savingNote={savingNote} handleSaveNote={handleSaveNote} handleToggleMenu={handleToggleMenu} setText={handleChange} text={note.content} hello="world" isViewer={isViewer} handleToggleViewer={handleToggleViewer} />
            )}
            {isViewer && (
                <MDX key={note.id} savingNote={savingNote} handleSaveNote={handleSaveNote} handleToggleMenu={handleToggleMenu} text={note.content} isViewer={isViewer} handleToggleViewer={handleToggleViewer} />
            )}
        </main>
    )
}