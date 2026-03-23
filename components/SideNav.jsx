import { useAuth } from "@/context/AuthContext"
import { db } from "@/firebase"
import { collection, deleteDoc, doc, getDocs } from "firebase/firestore"
import { useRouter } from "next/navigation"
import { useEffect, useRef } from "react"

export default function SideNav(props) {

    const { showNav, setShowNav, noteIds, setNoteIds, handleEditNote, handleCreateNote, setIsViewer } = props
    const { logout, currentUser } = useAuth()

    const ref = useRef()
    const router = useRouter()

    async function deleteNote(noteIdx) {
        try {
            const noteRef = doc(db, 'users', currentUser.uid, 'notes', noteIdx)
            await deleteDoc(noteRef)
            setNoteIds((curr) => {
                return curr.filter(idx => idx !== noteIdx)
            })
        } catch (err) {
            console.log(err.message)
        } finally { }
    }

    useEffect(() => {
        // this is the code block that gets executed when our ref changes (so in this case it's when the ref is assigned)

        function handleClickOutside(event) {
            if (ref.current && !ref.current.contains(event.target)) {
                setShowNav(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => {
            // cleanup - unbind the event listener on clean up
            document.removeEventListener('mousedown', handleClickOutside)
        }

    }, [ref])

    return (
        <section ref={ref} className={"nav " + (showNav ? '' : ' hidden-nav ')}>
            <h1 className="text-gradient">NOTE KEEPING</h1>
            <h6>Easy Breezy Notes</h6>
            <div className="full-line"></div>
            <button onClick={handleCreateNote}>
                <h6>New note</h6>
                <i className="fa-solid fa-plus"></i>
            </button>
            <div className="notes-list">
                {noteIds.length == 0 ?
                    <p>You have 0 notes</p> :
                    noteIds.map((note, idx) => {
                        const [n, d] = note.split('__')
                        const date = (new Date(parseInt(d))).toString()

                        return (
                           
                            <button onClick={() => {
                                setIsViewer(true)
                                setShowNav(false)
                                router.push('/notes?id=' + note)
                            }} key={idx} className="card-button-secondary list-btn">
                                <p>{n}</p>
                                <small>{date.split(' ').slice(1, 4).join(' ')}</small>
                                <div onClick={(e) => {
                                    e.stopPropagation()
                                    deleteNote(note)
                                }} className="delete-btn">
                                    <i className="fa-solid fa-trash-can"></i>
                                </div>
                                <div onClick={(e) => {
                                    e.stopPropagation()
                                    handleEditNote(note)
                                }} className="edit-btn">
                                    <i className="fa-solid fa-pen-to-square"></i>
                                </div>
                            </button>
                        )
                    })}
            </div>
            <div className="full-line"></div>
            <button onClick={logout} >
                <h6>Logout</h6>
                <i className="fa-solid fa-arrow-right-from-bracket"></i>
            </button>
        </section>
    )
}