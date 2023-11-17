const User = require("../models/User")
const Note = require("../models/Note")
const asyncHandler = require("express-async-handler")
const bcrypt = require("bcrypt")

// @desc Get all notes
// @route GET /notes
// @access Private
const getAllNotes = asyncHandler(async (req, res) => {
    const notes = await Note.find().lean()

    if (!notes?.length) {
        return res.status(400).json({ message: "No notes found" })
    }

    const notesWithUser = await Promise.all(notes.map(async (note) => {
        const user = await User.findById(note.user).lean().exec()
        return { ...note, username: user.username }
    }))

    res.json(notesWithUser)
})

// @desc Create a new note
// @route POST /notes
// @access Private
const createNewNote = asyncHandler(async (req, res) => {
    const { user, title, text } = req.body

    // Confirm data
    if (!user || !title || !text) {
        return res.status(400).json({ message: "All fields are required" })
    }

    // Check for duplicate title
    const duplicate = await Note.findOne({ title }).lean().exec()
    if (duplicate) {
        return res.status(409).json({ message: "Duplicate note title" })
    }

    // Create and store new note
    const note = await Note.create({ user, title, text })

    if (note) { // Created 
        return res.status(201).json({ message: "New note created" })
    } else {
        return res.status(400).json({ message: "Invalid note data received" })
    }
})

// @desc Update a note
// @route PATCH /notes
// @access Private
const updateNote = asyncHandler(async (req, res) => {
    const { id, user, title, text, completed } = req.body

    // Confirm data
    if (!id || !user || !title || !text || typeof completed !== "boolean") {
        return res.status(400).json({ message: "All fields are required" })
    }

    // Get note
    const note = await Note.findById(id).exec()
    if (!note) {
        return res.status(400).json({ message: "Note not found" })
    }

    // Check for duplicate title
    const duplicate = await Note.findOne({ title }).lean().exec()
    // Allow renaming of the original note 
    if (duplicate && duplicate?._id.toString() !== id) {
        return res.status(409).json({ message: "Duplicate note title" })
    }

    // Update
    note.user = user
    note.title = title
    note.text = text
    note.completed = completed
    const updatedNote = await note.save()
    res.json({ message: `"${updatedNote.title}" updated` })
})

// @desc Delete a note
// @route DELETE /notes
// @access Private
const deleteNote = asyncHandler(async (req, res) => {
    const { id } = req.body

    // Confirm Data
    if (!id) {
        return res.status(400).json({ message: "Note ID required" })
    }

    // Confirm note exists so we can delete it
    const note = await Note.findById(id).exec()
    if (!note) {
        return res.status(400).json({ message: "Note not found" })
    }

    await note.deleteOne()

    const reply = `Note titled "${note.title}" with ID ${note._id} deleted`

    res.json(reply)
})

module.exports = {
    getAllNotes,
    createNewNote,
    updateNote,
    deleteNote
}